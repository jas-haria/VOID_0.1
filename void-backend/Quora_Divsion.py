import enum
from bs4 import BeautifulSoup as bs

class Divisions(enum.Enum):
    GATE="GATE"
    VIDYALANKAR="Vidyalankar"
    SCIENCE="Science"
    ENGG="Engineering-Mumbai"
    BSCIT="BSCIT-Mumbai"


vidyalankar=['vidyalankar','vit+mumbai','vidyalankar+college','vidyalankar+classes','vidyalankar+institute+of+technology']
iitjee=['iit+jee','jee','iit','iit+jee','jee+mains','jee+advanced']
mhtcet=['mhtcet+exam','mht+cet','mht+cet+preparation','mh+cet','exam+mht+cet']
engineering=['engineering+classes+in+mumbai','engineering+classes+mumbai','fe+classes+mumbai','se+classes+mumbai','te+classes+mumbai','mumbai+university+engineering','engineering+mumbai+university']
bscit=['bscit+classes+in+mumbai','bscit+classes+mumbai','fy+bscit+classes+mumbai','sy+bscit+classes+mumbai','mumbai+university+bscit','bscit+mumbai+university']
gate=['gate+exam','psus',]
array=[vidyalankar,iitjee,mhtcet,engineering,bscit,gate]
questions={}
for i in array:
    for j in i:
        url="https://ww.quora.com/search?q="+j+"&time=day&type=question"
        print(url)