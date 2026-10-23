# Read-only diagnostics for an installed Pet. Does not read credentials or chat history.
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public class PaldeeWindowDiagnostics {
  public delegate bool Callback(IntPtr hwnd, IntPtr data);
  [StructLayout(LayoutKind.Sequential)] public struct Rect { public int Left, Top, Right, Bottom; }
  public class WindowInfo { public long Handle; public uint ProcessId; public bool Visible; public Rect Bounds; }
  [DllImport("user32.dll")] static extern bool EnumWindows(Callback callback, IntPtr data);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint pid);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr hwnd);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr hwnd, out Rect rect);
  public static WindowInfo[] Read(uint[] ids) {
    var found = new List<WindowInfo>();
    EnumWindows(delegate(IntPtr hwnd, IntPtr data) {
      uint pid; GetWindowThreadProcessId(hwnd, out pid);
      if (Array.IndexOf(ids, pid) >= 0) {
        Rect rect; GetWindowRect(hwnd, out rect);
        found.Add(new WindowInfo { Handle=hwnd.ToInt64(), ProcessId=pid, Visible=IsWindowVisible(hwnd), Bounds=rect });
      }
      return true;
    }, IntPtr.Zero);
    return found.ToArray();
  }
}
'@
Add-Type -AssemblyName System.Windows.Forms
$petProcesses = @(Get-Process -Name 'paldee-pet','octop-pet' -ErrorAction SilentlyContinue)
$systemInfo = Get-CimInstance Win32_OperatingSystem
$dataDirectory = if ($env:OCTOPPET_DATA_DIR) { $env:OCTOPPET_DATA_DIR } else { Join-Path $env:APPDATA 'com.octop.pet' }
$configFile = Join-Path $dataDirectory 'config.json'
$petConfig = $null
if (Test-Path -LiteralPath $configFile) {
    $config = Get-Content -LiteralPath $configFile -Raw -Encoding UTF8 | ConvertFrom-Json
    $petConfig = $config | Select-Object mascotId,petSize,petX,petY
}
[ordered]@{
    system = $systemInfo.Caption
    build = $systemInfo.BuildNumber
    graphics = @(Get-CimInstance Win32_VideoController | Select-Object Name,DriverVersion)
    processes = @($petProcesses | Select-Object Id,ProcessName)
    screens = @([System.Windows.Forms.Screen]::AllScreens | ForEach-Object {
        @{ primary=$_.Primary; left=$_.Bounds.Left; top=$_.Bounds.Top; width=$_.Bounds.Width; height=$_.Bounds.Height }
    })
    windows = @([PaldeeWindowDiagnostics]::Read([System.UInt32[]]@($petProcesses | ForEach-Object { $_.Id })))
    petConfig = $petConfig
} | ConvertTo-Json -Depth 6
