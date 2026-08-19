[CmdletBinding()]
param(
  [string]$Region = "us-east-1",
  [string]$StackName = "stm-parent-production",
  [string]$Repository = "corypahl/stm-parent",
  [string]$GitHubOidcSubject = "repo:corypahl@93232566/stm-parent@1326794857:ref:refs/heads/main",
  [string]$GitHubOidcProviderArn = "",
  [string]$CustomDomainName = "",
  [string]$HostedZoneId = "",
  [string]$Profile = $env:AWS_PROFILE,
  [switch]$SkipWorkflowDispatch
)

$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$templatePath = Join-Path $repositoryRoot "infrastructure/cloudfront.yml"
$awsProfileArguments = if ($Profile) { @("--profile", $Profile) } else { @() }

if ([bool]$CustomDomainName -ne [bool]$HostedZoneId) {
  throw "CustomDomainName and HostedZoneId must be supplied together."
}

aws sts get-caller-identity @awsProfileArguments --region $Region --output json | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "AWS authentication failed. Refresh the configured session (for SSO, run 'aws sso login --profile $Profile') and try again."
}

if (-not $GitHubOidcProviderArn) {
  $detectedProvider = aws iam list-open-id-connect-providers @awsProfileArguments --query "OpenIDConnectProviderList[?ends_with(Arn, '/token.actions.githubusercontent.com')].Arn | [0]" --output text
  if ($LASTEXITCODE -ne 0) {
    throw "Could not inspect existing IAM OIDC providers."
  }
  if ($detectedProvider -and $detectedProvider -ne "None") {
    $GitHubOidcProviderArn = $detectedProvider
  }
}

$parameterOverrides = @(
  "GitHubOidcProviderArn=$GitHubOidcProviderArn",
  "GitHubOidcSubject=$GitHubOidcSubject",
  "CustomDomainName=$CustomDomainName",
  "HostedZoneId=$HostedZoneId"
)

aws cloudformation deploy `
  @awsProfileArguments `
  --region $Region `
  --stack-name $StackName `
  --template-file $templatePath `
  --capabilities CAPABILITY_IAM `
  --no-fail-on-empty-changeset `
  --parameter-overrides $parameterOverrides
if ($LASTEXITCODE -ne 0) {
  throw "CloudFormation deployment failed."
}

$stackOutputs = aws cloudformation describe-stacks `
  @awsProfileArguments `
  --region $Region `
  --stack-name $StackName `
  --query "Stacks[0].Outputs" `
  --output json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) {
  throw "Could not read the CloudFormation stack outputs."
}

$outputs = @{}
foreach ($item in $stackOutputs) {
  $outputs[$item.OutputKey] = $item.OutputValue
}

gh variable set AWS_DEPLOY_ROLE_ARN --repo $Repository --body $outputs.DeploymentRoleArn
if ($LASTEXITCODE -ne 0) { throw "Could not set AWS_DEPLOY_ROLE_ARN in GitHub." }
gh variable set AWS_REGION --repo $Repository --body $Region
if ($LASTEXITCODE -ne 0) { throw "Could not set AWS_REGION in GitHub." }
gh variable set AWS_STACK_NAME --repo $Repository --body $StackName
if ($LASTEXITCODE -ne 0) { throw "Could not set AWS_STACK_NAME in GitHub." }

if (-not $SkipWorkflowDispatch) {
  gh workflow run cloudfront.yml --repo $Repository
  if ($LASTEXITCODE -ne 0) { throw "The stack is ready, but the GitHub deployment workflow could not be dispatched." }
}

Write-Host "CloudFront infrastructure is ready: $($outputs.SiteUrl)"
Write-Host "GitHub Actions deployment role: $($outputs.DeploymentRoleArn)"
