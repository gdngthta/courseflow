# Bulk-applies dark: variants to hardcoded dark Tailwind classes across src/.
# Idempotent: classes already preceded by 'dark:' are left alone.

$ErrorActionPreference = 'Stop'

# Color mapping: dark-class → light-class
$colorMap = [ordered]@{
  'bg-slate-950'             = 'bg-white'
  'bg-slate-900'             = 'bg-white'
  'bg-slate-800'             = 'bg-slate-100'
  'bg-slate-700'             = 'bg-slate-200'
  'bg-slate-600'             = 'bg-slate-300'
  'text-white'               = 'text-slate-900'
  'text-slate-200'           = 'text-slate-700'
  'text-slate-300'           = 'text-slate-600'
  'text-slate-400'           = 'text-slate-500'
  # 'text-slate-600' deliberately omitted: it's both a source AND target
  # (text-slate-300 maps to text-slate-600), which causes cascading edits.
  # text-slate-600 is neutral enough to remain readable on a light background.
  'border-slate-800'         = 'border-slate-200'
  'border-slate-700'         = 'border-slate-300'
  'border-slate-600'         = 'border-slate-400'
  'divide-slate-800'         = 'divide-slate-200'
  'placeholder:text-slate-500' = 'placeholder:text-slate-400'
  'placeholder:text-slate-600' = 'placeholder:text-slate-500'
}

# Variant prefixes we recognise so we can stamp them onto both halves.
$variants = 'hover:|focus:|active:|disabled:|group-hover:|focus-within:|focus-visible:|peer-focus:|peer-checked:|sm:hover:|md:hover:|lg:hover:'

$files = Get-ChildItem -Recurse -Path 'src' -Include *.tsx,*.ts | Where-Object {
  $_.FullName -notmatch 'globals\.css' -and
  $_.FullName -notmatch 'ThemeContext\.tsx' -and
  ($_.Name -ne 'layout.tsx' -or $_.FullName -match '\(app\)')
}

$totalChanges = 0
foreach ($file in $files) {
  $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
  if ($null -eq $content) { continue }
  $original = $content

  foreach ($darkClass in $colorMap.Keys) {
    $lightClass = $colorMap[$darkClass]
    $escaped = [regex]::Escape($darkClass)
    # Match: optional variant prefix, the dark class, optional /opacity, with a non-word boundary that's
    # NOT preceded by 'dark:' (idempotent).
    $regex = "(?<!dark:)(?<![A-Za-z0-9_-])((?:$variants)?)$escaped(\/\d+)?(?![A-Za-z0-9_-])"
    $content = [regex]::Replace($content, $regex, {
      param($m)
      $variant = $m.Groups[1].Value
      $opacity = $m.Groups[2].Value
      return ($variant + $lightClass + $opacity + ' dark:' + $variant + $darkClass + $opacity)
    })
  }

  if ($content -ne $original) {
    Set-Content -LiteralPath $file.FullName -Value $content -NoNewline -Encoding UTF8
    $totalChanges++
    Write-Host ("changed: " + $file.FullName.Replace($PWD.Path + [System.IO.Path]::DirectorySeparatorChar, ''))
  }
}

Write-Host ("`nDone. " + $totalChanges + " files changed.")
