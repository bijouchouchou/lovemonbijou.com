@echo off
chcp 65001 > nul
echo =======================================
echo    VERIFICATION PROJET WEB
echo =======================================
echo.

echo Fichiers trouves:
dir index.html style.css script.js 2>nul || echo Fichiers manquants!

echo.
echo Test encoding UTF-8:
powershell -Command "try { Get-Content 'index.html' -Encoding UTF8 >nul; echo [OK] index.html } catch { echo [ERREUR] index.html }"
powershell -Command "try { Get-Content 'style.css' -Encoding UTF8 >nul; echo [OK] style.css } catch { echo [ERREUR] style.css }"  
powershell -Command "try { Get-Content 'script.js' -Encoding UTF8 >nul; echo [OK] script.js } catch { echo [ERREUR] script.js }"

echo.
echo Structure HTML:
powershell -Command "if (Test-Path 'index.html') { $h=Get-Content 'index.html' -Raw; if ($h -match '<!DOCTYPE html>') { echo [OK] Doctype }; if ($h -match '<html') { echo [OK] Html }; if ($h -match '<head') { echo [OK] Head }; if ($h -match '<body') { echo [OK] Body } }"

echo.
pause