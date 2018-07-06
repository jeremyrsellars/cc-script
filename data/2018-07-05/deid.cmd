type patient.raw.csv |rg ",(798|748|1987)\d{6}," --replace ",$1,"> patient.csv
