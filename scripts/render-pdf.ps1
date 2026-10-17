param([Parameter(Mandatory=$true)][string]$InputPdf,[Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$storageType = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$pdfType = [Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType = WindowsRuntime]
$streamType = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
$readerType = [Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]
$optionsType = [Windows.Data.Pdf.PdfPageRenderOptions, Windows.Data.Pdf, ContentType = WindowsRuntime]
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name.StartsWith('IAsyncOperation') -and $_.GetGenericArguments().Count -eq 1 } | Select-Object -First 1
function Await-Operation($Operation, $ResultType) {
    $task = $asTask.MakeGenericMethod($ResultType).Invoke($null, @($Operation))
    $task.Wait()
    return $task.Result
}
$pdfPath = (Resolve-Path -LiteralPath $InputPdf).Path
[System.IO.Directory]::CreateDirectory([System.IO.Path]::GetFullPath($OutputDirectory)) | Out-Null
$file = Await-Operation ($storageType::GetFileFromPathAsync($pdfPath)) $storageType
$document = Await-Operation ($pdfType::LoadFromFileAsync($file)) $pdfType
for ($index = 0; $index -lt $document.PageCount; $index++) {
    $page = $document.GetPage($index)
    $stream = [Activator]::CreateInstance($streamType)
    $options = [Activator]::CreateInstance($optionsType)
    $options.DestinationWidth = 900
    $actionMethod = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and -not $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' } | Select-Object -First 1
    $actionMethod.Invoke($null, @($page.RenderToStreamAsync($stream, $options))).Wait()
    $reader = $readerType::new($stream.GetInputStreamAt(0))
    $loaded = Await-Operation ($reader.LoadAsync([uint32]$stream.Size)) ([uint32])
    $bytes = New-Object byte[] ([int]$stream.Size)
    $reader.ReadBytes($bytes)
    $output = Join-Path $OutputDirectory ('page-' + ($index + 1) + '.png')
    [System.IO.File]::WriteAllBytes([System.IO.Path]::GetFullPath($output), $bytes)
    Write-Output ('Rendered page ' + ($index + 1) + ' -> ' + $output)
    $reader.Dispose()
    $stream.Dispose()
    $page.Dispose()
}
