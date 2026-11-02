# Upscales image sequence frames to 2560x1440 with HighQualityBicubic resampling
Add-Type -AssemblyName System.Drawing

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]88)

$srcDir = "public\image-sequence-original-720p"
$destDir = "public\image-sequence"

$destW = 2560
$destH = 1440

for ($i = 0; $i -lt 240; $i++) {
  $name = "videp{0:D3}.jpg" -f $i
  $inPath = Join-Path $srcDir $name
  $outDest = Join-Path $destDir $name

  if (Test-Path $inPath) {
    $tempOut = [System.IO.Path]::GetTempFileName() + ".jpg"

    $src = [System.Drawing.Image]::FromFile((Resolve-Path $inPath))
    $bmp = New-Object System.Drawing.Bitmap($destW, $destH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $destW, $destH)), 0, 0, $src.Width, $src.Height, [System.Drawing.GraphicsUnit]::Pixel)

    $bmp.Save($tempOut, $codec, $encoderParams)
    $g.Dispose()
    $bmp.Dispose()
    $src.Dispose()

    Move-Item -Path $tempOut -Destination $outDest -Force
    if ($i % 24 -eq 0) {
      Write-Output "Processed frame $i / 240 -> $name (2560x1440)"
    }
  }
}
Write-Output "Finished upscaling all 240 frames to 2560x1440."

