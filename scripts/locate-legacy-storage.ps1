$roots = @(
  'E:\ai-storage',
  'L:\ai-storage',
  'D:\ai-storage',
  'C:\ai-storage',
  'L:\vallalhatatlan.online',
  'C:\Users\Tamas'
) | Where-Object { Test-Path $_ }

$found = @()

foreach ($root in $roots) {
  try {
    $found += Get-ChildItem -Path $root -Filter 'characters.json' -File -Recurse -ErrorAction SilentlyContinue
  } catch {}
}

if ($found.Count -eq 0) {
  Write-Host 'Nem találtam characters.json fájlt a gyakori storage-helyeken.' -ForegroundColor Yellow
  Write-Host ''
  Write-Host 'Próbáld meg célzottan megkeresni a régi projekt mappájában vagy futtasd:' -ForegroundColor Gray
  Write-Host "Get-ChildItem L:\ -Filter characters.json -File -Recurse -ErrorAction SilentlyContinue" -ForegroundColor Gray
  exit 0
}

Write-Host 'Talált legacy karakteradatok:' -ForegroundColor Green
foreach ($file in $found | Sort-Object FullName -Unique) {
  Write-Host ''
  Write-Host $file.FullName -ForegroundColor Cyan

  try {
    $data = Get-Content $file.FullName -Raw | ConvertFrom-Json
    if ($data -is [System.Array]) {
      Write-Host ("Karakterek: {0}" -f $data.Count)
      foreach ($character in $data | Select-Object -First 5) {
        Write-Host ("  - {0} [{1}]" -f $character.name, $character.id)
      }
    }
  } catch {
    Write-Host 'A JSON nem olvasható.' -ForegroundColor Red
  }

  $imageDir = Join-Path $file.DirectoryName 'images'
  if (Test-Path $imageDir) {
    Write-Host ("Images mappa: {0}" -f $imageDir) -ForegroundColor DarkCyan
  }
}
