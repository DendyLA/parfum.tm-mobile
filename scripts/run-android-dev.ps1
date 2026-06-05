$ErrorActionPreference = "Stop"

$androidStudioJdk = "C:\Program Files\Android\Android Studio\jbr"

if (-not (Test-Path -LiteralPath "$androidStudioJdk\bin\java.exe")) {
    throw "Android Studio JDK was not found at $androidStudioJdk"
}

$env:JAVA_HOME = $androidStudioJdk
$env:Path = "$androidStudioJdk\bin;$env:Path"

Write-Host "Using JAVA_HOME=$env:JAVA_HOME"
& java -version

& npx expo run:android
