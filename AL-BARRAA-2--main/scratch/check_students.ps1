$content = Get-Content -Raw -Encoding UTF8 "AL-BARRAA-2--main\BARAA-main\backup_recovery.json"
$json = ConvertFrom-Json $content
$y = $json.academicData."2025/2026"

Write-Host "Total students in 2025/2026: $($y.students.Count)"
Write-Host "Departments in 2025/2026:"
foreach ($d in $y.departments) {
    Write-Host "  Dept ID: $($d.id) | Name: $($d.name)"
}

$deptCounts = @{}
$unmatched = 0
foreach ($s in $y.students) {
    $dId = [string]$s.deptId
    $dObj = $y.departments | Where-Object { [string]$_.id -eq $dId }
    if ($dObj) {
        $dName = $dObj.name
        if (-not $deptCounts.ContainsKey($dName)) { $deptCounts[$dName] = 0 }
        $deptCounts[$dName]++
    } else {
        $unmatched++
        Write-Host "Unmatched student: $($s.info.'الاسم الكامل (بالعربية)') | deptId: '$dId'"
    }
}

Write-Host "`nCounts per department:"
foreach ($k in $deptCounts.Keys) {
    Write-Host "  $k : $($deptCounts[$k])"
}
Write-Host "Total unmatched: $unmatched"
