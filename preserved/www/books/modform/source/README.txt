Type make to build a pdf and dvi file of the book,
called main.dvi and main.pdf. 

I put a slightly hacked version of amsalpha.cls
in this directory, since the standard one on my
system refused to put \bibstyle{...}, etc. in 
main.aux.   I also had to write a Python script
"replace" to do some processing of the index
file. 


  TO BUILD YOU NEED:

    * latex
    * dvipdfm: http://gaspra.kettering.edu/dvipdfm/
    * Python
    * make


 -- William Stein