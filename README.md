# GDocsEditor

---instructions---
1. please ensure that you have npm on your computer
2. please go to https://console.cloud.google.com and create a new project on the upper left of your screen
    a. once you have your project created, in the burger menu, select "APIs and Services"
    b. press the + icon and enable APIs and Serivces
    c. search for docs and enable it
3. click on credentials and create a new credential (select service account)
    a. give it a name and grant it editor permissions
4. Head back to credentails and copy the newly created email
    a. in your docs share the docs to the new email you created with editor access
5. Copy the googledocs ID found after the "/d/" and before the "/edit" in the url
6. paste the ID in your env file.
7. ensure all your packages are installed and run the code with "node index.js"

---installation---
npm install googleapis