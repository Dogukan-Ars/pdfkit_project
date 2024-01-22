const PDFDocument = require('pdfkit');
const fs = require('fs');
const fileNameTemplate = '214232-tr.json';
const fileNameData = 'data.json'

const readJsonFileSync = (fileName) => {
  try {
    const data = fs.readFileSync(fileName, 'utf8');
    const formJson = JSON.parse(data);
    console.log('Başarılı!');
    return formJson;
  } catch (error) {
    console.log('Başarısız!');
    console.log('JSON parse hatası:', error);
    return null;
  }
};
const formJson = readJsonFileSync(fileNameTemplate);

const template = formJson.template;
const format = formJson.format;
const tests = formJson.tests;
const info = formJson.info;
const page = formJson.page;

// if (page) {
//   console.log('Page:', page);
// }

// Pdf yarat
const doc = new PDFDocument({ size: page.size, layout: page.layout, margins: page.margins }, { info });

// 2.8346667
const mmScale = doc.page.width / 210;


//#region Temayı Çiz
// Temp çiz
template.forEach((command) => {
  const commandType = Object.keys(command)[0]; // İlk (ve tek) anahtarı al
  switch (commandType) {
    case "rect":
      const { x: rectX, y: rectY, w, h, options: rectOptions } = command.rect;
      const dpiRectX = rectX * mmScale;
      const dpiRectY = rectY * mmScale;
      const dpiRectW = w * mmScale;
      const dpiRectH = h * mmScale;
      // rectColor'i options.colorBg'den al, eğer belirtilmişse
      const rectBgColor = rectOptions && rectOptions.colorBg ? rectOptions.colorBg : 'white';
      // rectLineColor'ı options.colorLine'dan al, eğer belirtilmişse
      const rectLineColor = rectOptions && rectOptions.colorLine ? rectOptions.colorLine : "black";
      // rectLineColor'ı options.colorLine'dan al, eğer belirtilmişse
      const rectLineWidth = rectOptions && rectOptions.lineWidth ? rectOptions.lineWidth : 1;
      // rectOpacity'i options.opacity'den al, eğer belirtilmişse
      const rectOpacity = rectOptions && rectOptions.opacity ? rectOptions.opacity : 0;

      // options içindeki renk bilgisini doc.fillColor fonksiyonu ile kullan
      if (rectOptions) {
        doc.save(); // Geçişin durumunu kaydet

        doc
          .rect(dpiRectX, dpiRectY, dpiRectW, dpiRectH)
          .lineWidth(rectLineWidth)
          .fillAndStroke(rectBgColor, rectLineColor)
          .fillOpacity(rectOpacity)
          .stroke();
        doc.restore(); // Geçişin durumunu geri yükle
      } else {
        doc.rect(dpiRectX, dpiRectY, dpiRectW, dpiRectH); // rectOptions'u doğrudan kullanabilirsiniz
      }
      break;
    case "text":
      const { text, x, y, options: textOptions } = command.text;

      const dpiX = x * mmScale;
      const dpiY = y * mmScale;
      // textColor'i options.colorText'ten al
      const textColor = textOptions && textOptions.colorText ? textOptions.colorText : 'black';
      // font kalın ya da ince ise sorarak doğru değeri çıktıya gönder
      const font = textOptions && textOptions.isBold ? 'Helvetica-Bold' : 'Helvetica';
      // textSize'ı options.fontSize'dan al
      const textSize = textOptions && textOptions.fontSize ? textOptions.fontSize : 18;
      const dpiTextSize = textSize * mmScale;
      // options içindeki renk bilgisini doc.fillColor fonksiyonu ile kullan
      if (textOptions) {
        doc.fontSize(dpiTextSize);
        doc.font(font);
        doc.fillColor(textColor);
        doc.text(text, dpiX, dpiY, textOptions).stroke();
      } else {
        doc.text(text, dpiX, dpiY);
      }
      break;
    case 'test':
      const { text: testText, x: testX, y: testY, options: testOptions } = command.test;

      const dpiTestX = testX * mmScale;
      const dpiTestY = testY * mmScale;
      // textColor'i options.colorText'ten al
      const testColor = testOptions && testOptions.colorText ? testOptions.colorText : 'black';
      // font kalın ya da ince ise sorarak doğru değeri çıktıya gönder
      const testFont = testOptions && testOptions.isBold ? 'Helvetica-Bold' : 'Helvetica';
      // textSize'ı options.fontSize'dan al
      const testSize = testOptions && testOptions.fontSize ? testOptions.fontSize : 18;
      const dpiTestSize = testSize * mmScale;
      // options içindeki renk bilgisini doc.fillColor fonksiyonu ile kullan
      if (testOptions) {
        // doc.rect(dpiTestX, dpiTestY, dpiTestSize, dpiTestSize).stroke(); // Örnek dikdörtgen çizimi
        doc.fontSize(dpiTestSize);
        doc.font(testFont);
        doc.fillColor(testColor);
        doc.text(testText, dpiTestX, dpiTestY); // options'u kullanma
      } else {
        doc.text(testText, dpiTestX, dpiTestY);
      }
      break;
    default:
      console.log("Unknown item type:", commandType);
  }

});


function fill(dataJsonString) {
  const dataJson = JSON.parse(dataJsonString);

  format.forEach((dataItems) => {
    const dataItem = Object.keys(dataItems)[0];
    // const dataItemRequire = Object.values(dataItems)[1];

    const { text, qrcode, code128, type } = dataItems[dataItem];
    const dataItemRequire = dataItems.require;

    const foundDataItem = dataJson.datas.find(item => item.hasOwnProperty(dataItem));

    if (foundDataItem) {
      // ToDo: Çizimleri yap.
      // console.log(Object.values(foundDataItem));
      let value = foundDataItem[dataItem];
      switch (true) {
        case !!text:
          // ToDo: Text çizimini yap
          const { x: formatX, y: formatY, options } = text;

          const dpiFormatX = formatX * mmScale;
          const dpiFormatY = formatY * mmScale;

          // font kalın ya da ince ise sorarak doğru değeri çıktıya gönder
          const font = options && options.isBold ? 'Helvetica-Bold' : 'Helvetica';
          // textSize'ı options.fontSize'dan al
          const textSize = options && options.fontSize ? options.fontSize * mmScale : 18;

          // characterSpacing'i options.fontSize'dan al
          const characterSpacing = options && options.characterSpacing ? options.characterSpacing * mmScale : '0';

          if (dataItem === "timestamp") {
            value = value.substring(0, 13).replace('T', 'H');
          }

          if (options && options.characterSpacing) {
            doc.fontSize(textSize);
            doc.font(font);
            doc.text(`${value}`, dpiFormatX, dpiFormatY, { characterSpacing }).stroke();
          } else {
            doc.text(`${value}`, dpiFormatX, dpiFormatY);
          }

          break;
        case !!qrcode:
          // ToDo: Code128 çizimini yap
          break;
        case !!code128:
          // ToDo: Code128 çizimini yap
          break;
        case !!type:
          // ToDo: Type çizimini yap

          break;
        default:
          console.log("Unknown item type:", dataItem);
          break;
      }
    } else {
      if (dataItemRequire) {
        console.log(`Data bulunamadı : ${dataItem} `)
        // ToDo: Eksik veri için hata ver.
      }
    }
  })


  // Test array'ini id'lerine göre sırala
  // tests.sort((a, b) => {
  //   const idA = Object.keys(a)[0];
  //   const idB = Object.keys(b)[0];
  //   return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
  // });

  tests.forEach((testItems) => {
    const testItemID = Object.keys(testItems)[0];
    const testItemArray = testItems[testItemID]
    // testItemID.forEach((testItemObject) => {
      // })
      
      testItemArray.forEach((testItemObject) => {
        testItemCommand = Object.keys(testItemObject)[0];
        

      // console.log(testItemObject)
      // console.log(testItemObject)
      const testItemRequire = testItemObject.require;

      const {text, rect } = testItemObject;

      const foundTestItem = dataJson.tests.find(item => item.hasOwnProperty(testItemID));

      if (foundTestItem) {
        // ToDo: Çizimleri yap.
        // console.log(Object.values(foundDataItem));
        let value = foundTestItem[testItemID];
        switch (true) {
          case !!rect:
            const { x: rectX, y: rectY, w, h, options: rectOptions } = testItemObject.rect;

            const dpiRectX = rectX * mmScale;
            const dpiRectY = rectY * mmScale;
            const dpiRectW = w * mmScale;
            const dpiRectH = h * mmScale;

            // rectColor'i options.colorBg'den al, eğer belirtilmişse
            const rectBgColor = rectOptions && rectOptions.colorBg ? rectOptions.colorBg : 'white';
            // rectLineColor'ı options.colorLine'dan al, eğer belirtilmişse
            const rectLineColor = rectOptions && rectOptions.colorLine ? rectOptions.colorLine : "black";
            // rectLineColor'ı options.colorLine'dan al, eğer belirtilmişse
            const rectLineWidth = rectOptions && rectOptions.lineWidth ? rectOptions.lineWidth : 1;
            // rectOpacity'i options.opacity'den al, eğer belirtilmişse
            const rectOpacity = rectOptions && rectOptions.opacity ? rectOptions.opacity : 0;

            // options içindeki renk bilgisini doc.fillColor fonksiyonu ile kullan
            if (rectOptions) {
              doc.save(); // Geçişin durumunu kaydet
              doc
                .rect(dpiRectX, dpiRectY, dpiRectW, dpiRectH)
                .lineWidth(rectLineWidth)
                .fillAndStroke(rectBgColor, rectLineColor)
                .fillOpacity(rectOpacity)
                .stroke();
              doc.restore(); // Geçişin durumunu geri yükle
            } else {
              doc.rect(dpiRectX, dpiRectY, dpiRectW, dpiRectH); // rectOptions'u doğrudan kullanabilirsiniz
            }
            break;
          case !!text:
            // ToDo: Test çizimini yap
            const { x, y, options: textOptions } = testItemObject.text;

            const dpiTextX = x * mmScale;
            const dpiTextY = y * mmScale;

            // textColor'i options.colorText'ten al
            const textColor = textOptions && textOptions.colorText ? textOptions.colorText : 'black';
            // font kalın ya da ince ise sorarak doğru değeri çıktıya gönder
            const font = textOptions && textOptions.isBold ? 'Helvetica-Bold' : 'Helvetica';
            // textSize'ı textOptions.fontSize'dan al
            const textSize = textOptions && textOptions.fontSize ? textOptions.fontSize * mmScale : 18;

            if (textOptions) {
              doc.fontSize(textSize);
              doc.font(font);
              doc.fillColor(textColor);
              doc.text(value, dpiTextX, dpiTextY, textOptions).stroke();
            } else {
              doc.text(value, dpiTextX, dpiTextY);
            }
            break;
          default:
            // Eğer id t101 gibi bir değerse ve text değeri varsa yeni bir başlık ekleyin
            console.log("Unknown item type:", testItemID);
            break;
        }

      } else {
        if (testItemRequire) {
          // console.log(`Text bulunamadı : ${testItemID} `)
          // ToDo: Eksik veri için hata ver.
        }
      }
    })
  })
}

// // Fonksiyonu çağırma

fill(fs.readFileSync(fileNameData, 'utf8'));
//#endregion

// Info bölümü
if (info) {
  const { x, y, rev, infoname, reliese, options } = info;

  const infoX = x * mmScale;
  const infoY = y * mmScale;

  // "options" içindeki özellikleri kontrol etme
  if (options) {
    const { colorText, isBold, fontSize } = options;

    // textSize'ı options.fontSize'dan al
    const textSize = options && fontSize ? fontSize : 9;
    const infoTextSize = textSize * mmScale;

    // Özellikleri PDF belgesine uygulama
    doc.fillColor(colorText || 'black');
    doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica');
    doc.fontSize(infoTextSize);
    // Belirtilen özellikleri PDF belgesine ekleme
    doc.text(`FORM [${infoname} Rev.${rev} ${reliese}]`, infoX, infoY, options).stroke();

  }
}

doc.pipe(fs.createWriteStream('example.pdf'));
doc.end()