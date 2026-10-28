$baseDir = "d:\b_bekkouri\MAINTENANCE BB\pic\COMPRESSEUR AF\AF\AF1\entretien AF1 032025\AL-BARRAA-2--main\AL-BARRAA-2--main\BARAA-main\js"
$files = @("backup.js", "auth.js", "firebase-sync.js", "state.js", "departments.js", "students.js", "performance.js", "app.js")

foreach ($f in $files) {
    $path = Join-Path $baseDir $f
    $text = [System.IO.File]::ReadAllText($path)
    $code = [regex]::Replace($text, '//.*$', '', [System.Text.RegularExpressions.RegexOptions]::Multiline)
    $code = [regex]::Replace($code, '/\*[\s\S]*?\*/', '')
    $code = [regex]::Replace($code, '"(?:[^"\\]|\\.)*"', '""')
    $code = [regex]::Replace($code, "'(?:[^'\\]|\\.)*'", "''")
    $code = [regex]::Replace($code, '`(?:[^`\\]|\\.)*`', '``')

    $p = ([regex]::Matches($code, '\(')).Count - ([regex]::Matches($code, '\)')).Count
    $b = ([regex]::Matches($code, '\{')).Count - ([regex]::Matches($code, '\}')).Count
    $s = ([regex]::Matches($code, '\[')).Count - ([regex]::Matches($code, '\]')).Count

    if ($p -eq 0 -and $b -eq 0 -and $s -eq 0) {
        Write-Host "OK: $f (all balanced)"
    } else {
        Write-Host "ERROR: $f -> Parens: $p, Braces: $b, Brackets: $s"
    }
}
