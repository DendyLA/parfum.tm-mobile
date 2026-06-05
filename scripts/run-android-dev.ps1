$ErrorActionPreference = "Stop"

$androidStudioJdk = "C:\Program Files\Android\Android Studio\jbr"
$androidSdk = "$env:LOCALAPPDATA\Android\Sdk"

if (-not (Test-Path -LiteralPath "$androidStudioJdk\bin\java.exe")) {
    throw "Android Studio JDK was not found at $androidStudioJdk"
}

if (-not (Test-Path -LiteralPath "$androidSdk\platform-tools\adb.exe")) {
    throw "Android SDK was not found at $androidSdk. Open Android Studio > More Actions > SDK Manager and install Android SDK Platform-Tools and Android SDK Platform 36."
}

$env:JAVA_HOME = $androidStudioJdk
$env:ANDROID_HOME = $androidSdk
$env:ANDROID_SDK_ROOT = $androidSdk
$env:Path = "$androidStudioJdk\bin;$env:Path"

Write-Host "Using JAVA_HOME=$env:JAVA_HOME"
Write-Host "Using ANDROID_HOME=$env:ANDROID_HOME"
& java -version

& npx expo run:android
