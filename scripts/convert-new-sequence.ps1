# Converts 4K PNG sequence (image000.png - image269.png) to high-performance 4K JPEG sequence (videp000.jpg - videp269.jpg)
Add-Type -AssemblyName System.Drawing

$srcDir = "c:\Users\souri\OneDrive\Desktop\New folder"
$destDir = "public\image-sequence"

if (!(Test-Path $destDir)) {
  New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]88)

$pngFiles = Get-ChildItem -Path $srcDir -Filter "*.png" | Sort-Object Name
$total = $pngFiles.Count

Write-Output "Found $total PNG frames to convert..."

for ($i = 0; $i -lt $total; $i++) {
  $file = $pngFiles[$i]
  $outName = "videp{0:D3}.jpg" -f $i
  $outPath = Join-Path $destDir $outName
  $tempOut = [System.IO.Path]::GetTempFileName() + ".jpg"

  $src = [System.Drawing.Image]::FromFile($file.FullName)
  $src.Save($tempOut, $codec, $encoderParams)
  $src.Dispose()

  Move-Item -Path $tempOut -Destination $outPath -Force

  if (($i + 1) % 27 -eq 0 -or ($i + 1) -eq $total) {
    $pct = [math]::Round((($i + 1) / $total) * 100)
    Write-Output "Converted $($i + 1) / $total frames ($pct%) -> $outName"
  }
}

Write-Output "Completed conversion of all $total frames to $destDir at 3840x2160."

