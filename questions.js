const questions = {

/* ===================== MATH (50 REAL MCQs) ===================== */
math: [
  { q:"If x + 9 = 16, what is x?", options:["6","7","8","9"], answer:1 },
  { q:"What is 14 × 6?", options:["84","86","88","82"], answer:0 },
  { q:"81 ÷ 9 = ?", options:["7","8","9","10"], answer:2 },
  { q:"Square root of 144?", options:["10","11","12","13"], answer:2 },
  { q:"25% of 200?", options:["25","40","50","60"], answer:2 },
  { q:"7² = ?", options:["42","49","56","36"], answer:1 },
  { q:"Solve: 5x = 40", options:["6","7","8","9"], answer:2 },
  { q:"LCM of 4 and 6?", options:["12","16","24","18"], answer:0 },
  { q:"HCF of 12 and 18?", options:["3","6","9","12"], answer:1 },
  { q:"12 × 12 = ?", options:["124","144","134","154"], answer:1 },

  { q:"Solve: 2x = 18", options:["7","8","9","10"], answer:2 },
  { q:"What is 15²?", options:["225","215","205","195"], answer:0 },
  { q:"What is 100 ÷ 4?", options:["20","25","30","35"], answer:1 },
  { q:"What is 3³?", options:["6","9","27","81"], answer:2 },
  { q:"Simplify: 3x + 2x", options:["5x","6x","3x²","x²"], answer:0 },

  { q:"What is 50% of 90?", options:["30","40","45","50"], answer:2 },
  { q:"What is 11 × 11?", options:["121","111","131","141"], answer:0 },
  { q:"What is 144 ÷ 12?", options:["10","11","12","13"], answer:2 },
  { q:"Solve: x + 5 = 12", options:["5","6","7","8"], answer:2 },
  { q:"What is 9²?", options:["72","81","90","99"], answer:1 },

  { q:"What is 18 ÷ 3?", options:["4","5","6","7"], answer:2 },
  { q:"What is 20% of 150?", options:["20","25","30","35"], answer:2 },
  { q:"What is 6 × 7?", options:["40","41","42","43"], answer:2 },
  { q:"What is 81 ÷ 9?", options:["7","8","9","10"], answer:2 },
  { q:"What is 10²?", options:["100","10","20","200"], answer:0 },

  { q:"Solve: 4x = 32", options:["6","7","8","9"], answer:2 },
  { q:"What is 2³?", options:["6","8","10","12"], answer:1 },
  { q:"What is 7 × 8?", options:["54","56","58","60"], answer:1 },
  { q:"What is 1/2 + 1/2?", options:["1","2","3","4"], answer:0 },
  { q:"What is 0.5 × 0.5?", options:["0.25","0.5","1","2"], answer:0 },

  { q:"What is 16 × 5?", options:["70","75","80","85"], answer:2 },
  { q:"What is 64 ÷ 8?", options:["6","7","8","9"], answer:2 },
  { q:"What is 13 + 19?", options:["31","32","33","34"], answer:1 },
  { q:"What is 99 - 45?", options:["44","54","64","74"], answer:1 },
  { q:"What is 5²?", options:["20","25","30","35"], answer:1 },

  { q:"What is 3 × 15?", options:["30","35","45","50"], answer:2 },
  { q:"What is 121 ÷ 11?", options:["9","10","11","12"], answer:2 },
  { q:"What is 8²?", options:["54","64","74","84"], answer:1 },
  { q:"What is 14 + 18?", options:["30","31","32","33"], answer:2 },
  { q:"What is 6²?", options:["30","36","42","48"], answer:1 },

  { q:"What is 200 ÷ 25?", options:["6","7","8","9"], answer:2 },
  { q:"What is 7 × 9?", options:["56","63","72","81"], answer:1 },
  { q:"What is 3/4 of 100?", options:["50","60","70","75"], answer:3 },
  { q:"What is 144 ÷ 16?", options:["7","8","9","10"], answer:2 },
  { q:"What is 9 × 6?", options:["52","54","56","58"], answer:1 }
],

/* ===================== CS (50 REAL MCQs) ===================== */
cs: [
  { q:"CPU stands for?", options:["Central Processing Unit","Computer Personal Unit","Core Processing Unit","Control Program Unit"], answer:0 },
  { q:"RAM is used for?", options:["Temporary memory","Permanent storage","Graphics","Internet"], answer:0 },
  { q:"HTML is used for?", options:["Structure webpages","Style webpages","Run programs","Store files"], answer:0 },
  { q:"CSS is used for?", options:["Styling","Logic","Database","AI"], answer:0 },
  { q:"JavaScript is used for?", options:["Interactivity","Hardware","Math only","Storage"], answer:0 },

  { q:"What is an algorithm?", options:["Step-by-step solution","Computer","File","Error"], answer:0 },
  { q:"What is a variable?", options:["Data storage","Loop","Function","Browser"], answer:0 },
  { q:"What is a loop?", options:["Repeating code","Error","File","System"], answer:0 },
  { q:"Binary uses?", options:["0 and 1","A and B","True/False only","Letters"], answer:0 },
  { q:"What is debugging?", options:["Fixing errors","Writing code","Deleting files","Running apps"], answer:0 },

  { q:"What is an OS?", options:["Operating System","Open Source","Online Server","Output System"], answer:0 },
  { q:"What is Python?", options:["Programming language","Snake","Database","Browser"], answer:0 },
  { q:"What is a function?", options:["Reusable code","File","Error","System"], answer:0 },
  { q:"What is Git?", options:["Version control","Browser","Editor","Game"], answer:0 },
  { q:"What is a database?", options:["Data storage","Game","Browser","Virus"], answer:0 },

  { q:"What is SQL?", options:["Database language","Game engine","Browser","OS"], answer:0 },
  { q:"Frontend means?", options:["User side","Server side","Database","Network"], answer:0 },
  { q:"Backend means?", options:["Server side","User side","Design","Storage"], answer:0 },
  { q:"What is an API?", options:["System communication","Game","Browser","File"], answer:0 },
  { q:"What is cloud computing?", options:["Internet storage","Local storage","Hardware","Game engine"], answer:0 },

  { q:"What is a bug?", options:["Error","Feature","Code","System"], answer:0 },
  { q:"What is a compiler?", options:["Translates code","Runs games","Deletes files","Stores data"], answer:0 },
  { q:"What is recursion?", options:["Function calling itself","Loop","Error","Variable"], answer:0 },
  { q:"What is OOP?", options:["Object oriented programming","Open OS program","Online output process","None"], answer:0 },
  { q:"What is JSON?", options:["Data format","Game","OS","Virus"], answer:0 },

  { q:"What is a server?", options:["Responds to requests","Game","Browser","File"], answer:0 },
  { q:"What is HTTP?", options:["Web protocol","Game","OS","Language"], answer:0 },
  { q:"What is HTTPS?", options:["Secure HTTP","Fast HTTP","Old HTTP","Fake HTTP"], answer:0 },
  { q:"What is malware?", options:["Bad software","Good software","Hardware","Network"], answer:0 },
  { q:"What is encryption?", options:["Data protection","Data deletion","Game","Browser"], answer:0 },

  { q:"What is WiFi?", options:["Wireless internet","Wired internet","Software","Hardware"], answer:0 },
  { q:"What is IP address?", options:["Device ID","Game ID","File","Code"], answer:0 },
  { q:"What is DNS?", options:["Domain system","Data node system","Digital network","None"], answer:0 },
  { q:"What is cache?", options:["Temporary memory","Permanent memory","Game","System"], answer:0 },
  { q:"What is a browser?", options:["Web viewer","Game","OS","Server"], answer:0 }
]

};

module.exports = questions;
