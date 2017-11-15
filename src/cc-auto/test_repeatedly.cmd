@ECHO OFF
:start
ECHO Testing at %date% %time%
call test_patients.cmd
timeout /t 390
goto :start
