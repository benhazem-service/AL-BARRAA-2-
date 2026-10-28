$content = Get-Content -Raw -Encoding UTF8 "AL-BARRAA-2--main\BARAA-main\backup_recovery.json"
$json = ConvertFrom-Json $content

Write-Host "Keys in backup:"
($json | Get-Member -MemberType NoteProperty).Name | ForEach-Object { Write-Host " - $_" }

Write-Host "`nCurrent Academic Year in backup: $($json.currentAcademicYear)"
Write-Host "Academic Years in backup: $($json.academicYears -join ', ')"

foreach ($yearProp in $json.academicData.PSObject.Properties) {
    $yName = $yearProp.Name
    $yData = $yearProp.Value
    $depts = $yData.departments
    $students = $yData.students
    Write-Host "`n==============================================="
    Write-Host "Year: $yName | Depts: $($depts.Count) | Students: $($students.Count)"
    Write-Host "==============================================="
    foreach ($d in $depts) {
        $stInDept = ($students | Where-Object { [string]$_.deptId -eq [string]$d.id }).Count
        Write-Host "  Dept: '$($d.name)' (ID: $($d.id)) -> $stInDept students"
    }
    $unassigned = ($students | Where-Object { -not $_.deptId -or -not ($depts | Where-Object { [string]$_.id -eq [string]$_.deptId }) }).Count
    Write-Host "  Unassigned students: $unassigned"
}
