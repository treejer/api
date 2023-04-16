

if [ -z "$1" ]
then
      read -p 'wallet (like 0x2132...) : ' wallet
else
      wallet=$1

fi

if [ -z "$2" ]
then
      read -p 'role (USER = 1, PLANTER = 2, ADMIN = 3,): ' role
else
      role=$2

fi


npx nestjs-command add:role $wallet $role
