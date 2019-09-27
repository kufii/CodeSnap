[Reflection.Assembly]::LoadWithPartialName('System.Drawing');
[Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms');

$file = Get-Item($args[0]);
$img = [System.Drawing.Image]::Fromfile($file);
[System.Windows.Forms.Clipboard]::SetImage($img);
