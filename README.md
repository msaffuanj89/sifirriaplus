# SifirRia+ Production Clean

This ZIP contains the cleaned production version of SifirRia+ split into three GitHub-ready files:

- index.html
- style.css
- script.js

## Demo Login
Username: demo
Password: 1234

## How to use
1. Extract this ZIP.
2. Open index.html in a browser.
3. To publish online, upload all three files to GitHub.
4. Enable GitHub Pages from the repository settings.

## Notes
This version is based on the full SifirRia+ production code provided in the uploaded source.


## Update: No Email Verification
Students can sign up directly using username and password only. The email field and verification button have been removed.


## Firebase Final Ready
This version automatically saves:
- Login record
- Completed game progress

Firestore path:
users / username / progressLogs


## Firebase Account Login Added
Register/login now uses Firestore accounts, so accounts work across devices.
Firestore paths: accounts / username and users / username / progressLogs.


## Firebase Sync Full Version
This version uses Firebase as the main source for:
- account login/register
- coins
- XP
- level
- daily progress
- sifir records
- progress logs

Firestore structure:
- accounts/{username}
- users/{username}/progressLogs/{autoId}

Upload all files to GitHub Pages.


## Firebase Sync Full V2 Fix
This version fixes cross-device data appearing empty by:
- reading main totals from accounts/{username}
- falling back to users/{username}.lastData from older versions
- syncing the merged values back to accounts on login
- also loading demo account progress from Firebase


## Firebase Sync Full V3
Fixes:
1. New device can recover old users from users/{username} if accounts/{username} is missing.
2. Previous day progress is rebuilt from users/{username}/progressLogs.
3. Coins, XP, daily progress and sifir records sync back into accounts/{username}.
4. Login message now tells user to SIGN UP first only if no account and no old data exist.


## Signup Profile Fields Added
Signup now requires:
- Full Name
- Date of Birth
- Class / Grade
- School Name
- State

These fields are saved in Firebase under:
accounts/{username}


## Full Class + Firebase Integration
Added:
1. Student / Teacher role during signup.
2. Teacher code: GURU123.
3. Teacher can create class and get class code.
4. Student must enter class code during signup.
5. Teacher dashboard only shows students linked to the teacher's classes.
6. Firebase collections used:
   - accounts
   - classes
   - users/{username}/progressLogs


## Teacher Signup UI Fix
When Account Type is Teacher, the Class / Grade field is hidden.


## Loading Fast Fixed
This version fixes slow "Loading classes..." by:
- loading student summary from accounts only
- not reading progressLogs during dashboard load
- loading progressLogs only when a teacher clicks a student row
- keeping Active Score and activity status in the dashboard


## Class Rival Mission Upgrade
Current Mission now shows a healthy class challenge:
- If another student has the best class record for the selected sifir, the app encourages the current student to beat that record.
- If the current student is already the class leader, the app encourages them to defend the record.
- If nobody in the class has a record yet, the app encourages the student to become the first class champion.


## Welcome Page Added
After successful login, SifirRia+ shows a welcome page with logo and short sound for 5 seconds.
Then it automatically opens:
- Student game page, or
- Teacher dashboard page


## Logo Fixed
The welcome page logo is embedded directly into index.html as base64, so it will display correctly on GitHub Pages even if the assets path has issues.


## Detail Sort + Malaysia Time
Teacher Dashboard student detail table now supports sorting by:
- Sifir
- Time
- Coins Awarded
- XP Awarded
- Completed At

Completed At is displayed using Malaysia time zone: Asia/Kuala_Lumpur.


## Admin Login + Dashboard
Admin registration is disabled in the app. Admins must use the Admin Login button and must already have an `accounts/{username}` document with `role: "admin"`.

The Admin Dashboard summarizes:
- active schools
- active students
- active teachers
- all users and classes


## Teacher Signup Fields
Teacher signup now follows the TenBox Math registration fields more closely:
- Nama Penuh
- Sekolah / Institusi
- Kod Sekolah
- Negeri
- Daerah
- Tarikh Lahir
- Jantina
- Email
- Kod Guru


## Login Flow
After student login, the app shows the welcoming page first, then opens a student activity menu:
- Sifir Challenge opens random multiplication facts from sifir 1 to 12.
- Sifir Challenge Level 1 gives 3 answer choices, checks immediately, then changes question automatically.
- Sifir Challenge Level 2 shows the typed answer inside the question, checks automatically after the full answer length is typed, then changes question automatically.
- Sifir Challenge shows a Current Challenge mission for class leader targets or self challenge.
- Challenge achievement stats sync to teacher and admin dashboards.
- Sifir Go lets students choose a 2-digit number and fill boxes labelled Sifir 1 to Sifir 12, with tens/ones breakdown linked to Sifir 2 Digit.
- Sifir 2 Digit opens the existing multiplication game.

After teacher login, the app shows the welcoming page first, then opens the Teacher Dashboard.
