var fs = require('fs');
var pdf = require('html-pdf');
var options = { format: 'Letter' };
var request = require('request');
var HTMLParser = require('node-html-parser');
var level = require('level');
var db = level('./mydb')



let last_time;


last_time = db.get('last_time', function (err, value) {
  if (err) {
    var d = new Date();
    db.put('last_time', d, function (err) {
      if (err) return console.log('Ooops!', err) // some kind of I/O error

      db.get('last_time', function (err, value) {
        last_time = value;
      })

    })
  }

  last_time = value;
  console.log('last_time', last_time);
})


var args = process.argv.splice(2)

let record = false;

if(args.length > 0) {
  record = true;
  console.log('将会记录本次拉取结果');
} else {
  console.log('不记录本次拉取结果');
}



let r = request({
  url: 'https://etherscan.io/token/generic-tokenholders2?a=0xd1dc215e1e4df951d0e0fa8e28efa6b3809adf5f&s=5000000000000000000000000000',
  timeout: 5000
});

r.on('response', function (response) {

    if(response.statusCode === 200) {

      var doc = HTMLParser.parse('<html>' + 
      '<head><meta charset="utf-8">' + '<meta name="viewport" content="width=device-width, initial-scale=1.0">' + 
      '<meta name="format-detection" content="telephone=no"></head><body></body></html>');

      var body = doc.querySelector('body');
      response.pipe(fs.createWriteStream('temp.html'))
        .on('finish', async ()=>{
          console.log('http finish')
          var html = fs.readFileSync('./temp.html');
          var root = HTMLParser.parse(html.toString());
          var maintable = root.querySelector('#maintable');
          var table = maintable.childNodes[1];
          var top50 = 0;
          for(let i = 0; i < table.childNodes.length; i++) {

            if(table.childNodes[i] instanceof HTMLParser.HTMLElement) {

              if(i == 1) {
                let e = new HTMLParser.HTMLElement('th', {id:'e'+i}, null) ;
                e.set_content('增加或减少');
                table.childNodes[i].appendChild(e)
              } else {

                let address = table.childNodes[i].childNodes[1].text;
                let quantity = parseFloat(table.childNodes[i].childNodes[2].text);

                top50 += quantity;
                let oldquantity = -1;
                try {
                  oldquantity = await db.get(address);
                } catch(e) {

                }

                if(record) {
                  await db.put(address, quantity);
                }

                let change = quantity - oldquantity;

                let styleStr = '';

                if(change > 0) {
                  styleStr = 'style="color:red;"';
                } else if( change < 0) {
                  styleStr = 'style="color:green;"';
                }

                let e = new HTMLParser.HTMLElement('td', {id:'e'+i}, styleStr) ;
                let content = '' + change;
                if(oldquantity === -1) {
                  content += '新进';
                }
                e.set_content(content);
                table.childNodes[i].appendChild(e)
              }
            } else {
              //console.log(table.childNodes[i])
            }
          }


          let time = new Date();

          let title = new HTMLParser.HTMLElement('h1', {id:'title'}, null) ;

          title.set_content('batt 持仓情况报表');

          body.appendChild(title);

          let titleTime = new HTMLParser.HTMLElement('h3', {id:'title'}, null) ;

          titleTime.set_content('上一次持仓统计时间:' + last_time + ", 当前统计时间：" +  time);


          body.appendChild(titleTime);

          body.appendChild(table);


          let top50Tatal = new HTMLParser.HTMLElement('h2', {id:'top50'}, null) ;

          var per = new Number(top50/5000000000*100);
          top50Tatal.set_content('前50个占总量百分比: ' + per.toFixed(2) + '%');
          body.appendChild(top50Tatal);

          let docString = doc.toString();
          fs.writeFileSync('./out.html', docString)

          pdf.create(docString, options).toFile('./batt-' + time.toLocaleDateString() + '.pdf', function(err, res) {
            if (err) return console.log('Ooops!', err) // some  error
            console.log(res); // { filename: '/app/businesscard.pdf' }
            console.log('报表生成成功...'); 
            db.put('last_time', time, function (err) {
              if (err) return console.log('Ooops!', err) // some kind of I/O error
        
            })
          });
        })
    }
})
.on('error', function (err) {
  console.error('httpStream error', err)
})


