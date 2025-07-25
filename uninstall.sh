#! /bin/bash
set -e

NAME=CustomizeClockOnLockScreen
DOMAIN=pratap.fastmail.fm
UUID=$NAME@$DOMAIN

echo -e "\n\n\t~~~~~~~~~~~~~~~~ Customize Clock On Lock Screen ~~~~~~~~~~~~~~~~\n"
echo -e "\trunning the script...\n"

if $(gnome-extensions list | grep -q $UUID); then
    gnome-extensions uninstall $UUID
else
    echo -e "\tCustomize Clock On Lock Screen is not installed, exiting..."
    echo -e "\n\t~~~~~~~~~~~~~~~~~~ Thank You ~~~~~~~~~~~~~~~~~~\n\n"
    exit 1
fi

echo -e "\t------------------------------------------
\t| Customize Clock On Lock Screen is uninstalled |
\t------------------------------------------"

echo -e "\n\t~~~~~~~~~~~~~~~~~~ Thank You ~~~~~~~~~~~~~~~~~~\n\n"
exit 0
