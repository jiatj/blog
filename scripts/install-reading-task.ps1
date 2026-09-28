param(
  [string]$At = "08:00",
  [string]$TaskName = "AI Builder Lab Reading Scan"
)

$parsedTime = [DateTime]::MinValue
if (-not [DateTime]::TryParseExact($At, "HH:mm", $null, [Globalization.DateTimeStyles]::None, [ref]$parsedTime)) {
  throw "-At must use HH:mm, for example 08:00"
}

$projectPath = Split-Path -Parent $PSScriptRoot
$npmCommand = Get-Command npm.cmd -ErrorAction Stop
$escapedProjectPath = $projectPath.Replace("'", "''")
$escapedNpmPath = $npmCommand.Source.Replace("'", "''")
$arguments = "-NoProfile -NonInteractive -Command `"Set-Location -LiteralPath '$escapedProjectPath'; & '$escapedNpmPath' run reading:scan`""
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $arguments
$trigger = New-ScheduledTaskTrigger -Daily -At $parsedTime

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Description "Collect previous-day reading sources for AI Builder Lab" -Force | Out-Null
Write-Host "Scheduled task '$TaskName' installed for $At every day."
