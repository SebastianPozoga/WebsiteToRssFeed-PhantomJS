
function toRssItem(item){
    var xml = '';
    if(item.title){
        xml+='<title><![CDATA['+item.title+']]></title>\n';
    }
    if(item.description){
        xml+='<description><![CDATA['+item.description+']]></description>\n';
    }
    if(item.link){
        xml+='<link><![CDATA['+item.link+']]></link>\n';
    }
    return xml;
}

function toRss(feed){
    var response = '<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n';
    response += toRssItem(feed);
    if(feed.items){
        for(item in feed.items){
            response += '<item>\n';
            response += toRssItem(feed.items[item]);
            response += '</item>\n';	
        }
    }
    response += '</channel>\n</rss>';
    return response;
}

/*
 *Get text
 */
function getTextContentExceptScript(element) {
    var text= [];
    for (var i= 0, n= element.childNodes.length; i<n; i++) {
        var child= element.childNodes[i];
        if (child.nodeType===1 && child.tagName.toLowerCase()!=='script'){
            text.push(getTextContentExceptScript(child));
        }else{
            if (child.nodeType===3){
                text.push(child.data);
            }
        }
    }
    return text.join('');
}


/*
 * Render rss chanel
 */
function renderRSS(url, response){
    var page = require('webpage').create();
    page.open(url, function (status) {
        if (status !== 'success') {
            console.log('FAIL to load the address');
            phantom.exit();
        } else {
            var data = page.evaluate(function() {
                //feed
                var feed = new Object();
                feed.title=document.title;
                feed.description=document.description;
                feed.link=document.URL;
                feed.items = new Array();
                //items
                var list = document.querySelectorAll('html body div#bn_wrapper div#bn_content table tbody tr td table tbody tr td a.articleTitleLink');
                for(var i=0; i<list.length; i++) {
                    var item = new Object();
                    //title
                    item.title = list[i].innerHTML;
                    //link
                    item.link = list[i].href;
                    //desc
                    //var desc = list[i].querySelectorAll('td.cellPrice span');
                    //item.description = desc[0].textContent;
                    feed.items.push(item);
                }
                return feed;
            });
            response.statusCode = 200;
            response.headers['Content-Type'] = 'application/xml';
            response.write(toRss(data));
            response.close();
        //phantom.exit();
        }
    });
}

/*
 * Web serv
 */
var url;
if(phantom.args[0]){
    url = phantom.args[0];
}else{
    url = "http://www.bankier.pl/wiadomosci/news.html?type_id=1%2B2%2B3%2B4%2B5%2B6%2B7%2B8%2B9%2B10%2B11&order=time&instr=10000000641";
}
var port;
if(phantom.args[1]){
    port = phantom.args[1];
}else{
    port = 7777;
}
server = require('webserver').create();
service = server.listen(port, function (request, response) {
    renderRSS(url, response)
});

