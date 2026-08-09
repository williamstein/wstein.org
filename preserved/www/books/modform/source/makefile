all:    main.pdf

main.dvi: main.tex appendix.tex body.tex preface.tex solutions.tex macros.tex biblio.bib
	rm -f *.aux *.ind *.idx
	latex main
	bibtex main
	./replace "@" "" main.idx
	makeindex main
	./process_ind.py
	latex main
	latex main
	latex main
	ln -sf main.dvi body.dvi; ln -sf main.dvi appendix.dvi; \
	ln -sf main.dvi solutions.dvi

main.ps:  main.dvi
	dvips -Ppdf -f < main.dvi > main.ps

main.pdf: main.ps
	ps2pdf main.ps main.pdf
	rm main.ps


quick:  main.tex appendix.tex body.tex preface.tex \
           solutions.tex macros.tex
	latex main
	touch quick


clean:
	mkdir -p old
	mv -f quick main.dvi *.aux *.toc *.log *.bbl *.ind *.idx *.ilg *.log *.pdf old/

dist:	
	rm -rf stein-modform
	mkdir stein-modform
	cp -r .hg README.txt main.pdf main.dvi process_ind.py *.tex *.sty *.cls diagrams makefile replace *.bib stein-modform/
	hg log > stein-modform/changelog.txt
	tar -zcvf stein-modform.tar.gz stein-modform


old:
	old *.tex *.cls *.sty *.txt makefile
	touch old

main.dvi.ne:  main.tex appendix.tex body.tex preface.tex \
           solutions.tex macros.tex biblio.bib
	ltx main; bibtex main; ./replace "@" "" main.idx; \
        makeindex main; ltx main; ltx main; \
        ln -sf main.dvi body.dvi; ln -sf main.dvi appendix.dvi; \
	ln -sf main.dvi solutions.dvi


