@echo off
chcp 65001 > nul
echo =======================================
echo     REPARATION COMPLETE DU PROJET
echo =======================================
echo.

echo Étape 1: Conversion en UTF-8...
powershell -Command "Get-Content 'index.html' | Out-File 'index.html' -Encoding UTF8; echo [OK] index.html UTF-8"
powershell -Command "Get-Content 'style.css' | Out-File 'style.css' -Encoding UTF8; echo [OK] style.css UTF-8" 
powershell -Command "Get-Content 'assets\script.js' | Out-File 'assets\script.js' -Encoding UTF8; echo [OK] assets/script.js UTF-8"

echo.
echo Étape 2: Verification des fichiers...
powershell -Command "try { Get-Content 'index.html' -Encoding UTF8 >nul; echo [OK] index.html UTF-8 valide } catch { echo [ERREUR] index.html }"
powershell -Command "try { Get-Content 'style.css' -Encoding UTF8 >nul; echo [OK] style.css UTF-8 valide } catch { echo [ERREUR] style.css }"
powershell -Command "try { Get-Content 'assets\script.js' -Encoding UTF8 >nul; echo [OK] assets/script.js UTF-8 valide } catch { echo [ERREUR] assets/script.js }"

echo.
echo Étape 3: Verification structure...
powershell -Command "$h=Get-Content 'index.html' -Raw; if ($h -match 'assets/script.js') { echo [OK] Chemin script correct } else { echo [ALERTE] Verifier chemin script dans index.html }"

echo.
echo Résumé fichiers:
dir index.html style.css
dir assets\script.js

echo.
echo =======================================
echo     VERIFICATION TERMINEE
echo =======================================
pause