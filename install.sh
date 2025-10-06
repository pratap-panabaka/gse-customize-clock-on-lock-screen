#! /bin/bash
set -e

NAME=CustomizeClockOnLockScreen
DOMAIN=pratap.fastmail.fm
UUID=$NAME@$DOMAIN
ZIP_NAME=$UUID.zip

# Findout gnome-shell version
SHELL_VERSION=$(gnome-shell --version | cut -d ' ' -f3 | cut -d '.' -f1)

if [[ $SHELL_VERSION -lt 45 ]]
then
    echo "This script is not for the gnome-shell versions below 45, Exiting with no changes."
    exit 1
fi

echo -e "\n\n\t~~~~~~~~~~~~~~~~ Customize Clock On Lock Screen ~~~~~~~~~~~~~~~~\n"
echo -e "\trunning the script...\n"
echo -e "\t1. gnome-shell version $SHELL_VERSION detected"

if [[ $SHELL_VERSION -ge 45 ]]; then
  cd src/v-45-46-47-48-49
fi

echo -e "\t2. Creating zip file..."
zip -qr $ZIP_NAME ./* && echo -e "\t3. zip file created"

echo -e "\t4. Installing the extension from the zip file...\n"

gnome-extensions install -f $ZIP_NAME
rm -rf $ZIP_NAME

echo -e "\t------------------------------------------
\t| Customize Clock On Lock Screen Extension is installed |
\t------------------------------------------

\tNow please enable the extension, once extension is enabled then
\tYou can customize clock on lockscreen from extensions settings"
echo -e "\n\t~~~~~~~~~~~~~~~~~~ Thank You ~~~~~~~~~~~~~~~~~~\n"
exit 0
