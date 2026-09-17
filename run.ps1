
$envVars = Get-Content .env
foreach ($line in $envVars) {
  if ($line -match "^([^=]+)=(.*)$") {
    $name = $matches[1]
    $value = $matches[2]
    Set-Item "Env:$name" $value
  }
}
node fix-subjects.js

