let DB = null;

const APP = {
    dataList: null, //null means no data, [] means empty results
    nextPage: './results.html', //holds where we want to navigate
    keyword: null,
    init: ()=>{
        //page is loaded
        DB = new FAKEIDB();
        APP.addListeners();
        APP.pageSpecific();
    },
    addListeners: ()=>{
        let h2 = document.querySelector('header h2');
        h2.addEventListener('click', APP.doSearch);
    },
    pageSpecific: ()=>{
        if(document.getElementById('home')){
            //home page
        }
        if(document.getElementById('results')){
            //results page
            //get keyword from querystring
            //get match from DB
            //display results
            let url = new URL(window.location.href);
            let params = url.searchParams;
            console.log(params.has('keyword'), params.get('keyword'));
            APP.keyword = params.get('keyword');
            APP.loadFromDB(); //called when results page is loading
        }
    },
    doSearch:(ev)=>{
        //clicked a span to do a search
        ev.preventDefault(); //if this were a link or form it would navigate so we want to stop that
        let span = ev.target.closest('span');
        if(span){
            keyword = span.textContent;
            console.log(`search for ${keyword}`);
            APP.keyword = keyword;
            APP.findInDBorFetch(keyword);
            //need to check db, 
            //if no match, do fetch, then save in db, then build url, then navigate
            //if match, then build url, then navigate
            //but all this is asynchronous so we need to wait for the result of each step
        }
    },
    loadFromDB: ()=>{
        //used on the results page when loading the page
        DB.getMatch(APP.keyword);
        DB.addEventListener('complete', APP.buildList, {once:true}); //after doing a search in db
    },
    findInDBorFetch: (keyword)=>{
        //do search in db for match after clicking search link
        console.log(`check db for ${keyword}`);
        DB.getMatch(keyword);
        //this will trigger the `complete` event that will call matchFound
        DB.addEventListener('complete', APP.dbMatchResults, {once:true}); //after doing a search in db
    },
    saveToDB: (keyword, results)=>{
        //save in db
        console.log(`save fetch results for ${keyword} in db`);
        DB.saveMatch(keyword, results);
        DB.addEventListener('success', APP.dataSaved, {once:true}); //after saving a result in db
    },
    doFetch: (keyword)=>{
        //do the fake call
        console.log(`do a fetch call for ${keyword}`);

        FAKEAPI.fetch(keyword)
            .then((response)=>{
                console.log(`fetch response `,  response.results );
                return response.results;
            }).then(results=>{
                //save the results in APP.dataList
                APP.dataList = results;
                //could be an empty array
                //if empty we won't save it in this example... you can for the real project if you want
                if(results.length === 0){
                    document.querySelector('main').innerHTML = '<h1>No matches for search.</h1>';
                }else{
                    APP.saveToDB(keyword, results);
                }

            })
    },
    dbMatchResults: (ev)=>{
        //DB match results
        console.log(`results from db ${ev.detail.results}`);
        APP.dataList = ev.detail.results;
        if(APP.dataList.length === 0){
            //need to do fetch
            APP.doFetch(APP.keyword);
        }else{
            //there is a match so navigate
            APP.navigate(APP.keyword)
        }
    },
    dataSaved: (ev)=>{
        //result saved in DB
        console.log(`data saved in db ${ev.detail}`);
        APP.navigate(ev.detail.keyword);
    },
    buildList: (ev)=>{
        APP.dataList = ev.detail.results;
        console.log('build html')
        let main = document.querySelector('main');
        let df = document.createDocumentFragment();
        APP.dataList.forEach(item=>{
            let p = document.createElement('p');
            p.textContent = item.title;
            p.setAttribute('data-key', item.id);
            df.append(p);
        });
        main.append(df);
    },
    navigate: (keyword)=>{
        let url = `${APP.nextPage}?keyword=${keyword}`;
        console.log(`navigate to ${url}`);
        window.location = url;
    }
}

document.addEventListener('DOMContentLoaded', APP.init);


//CODE below here is just for replicating a fake DB, and a fake API not needed for project

class FAKEIDB extends EventTarget {
    //pretend this is the real indexedDB object in the browser
    constructor (){
        super();
        this.results = null;
        this.keyword = null;
    }

    getMatch(keyword){
        //pretend to take a second
        this.keyword = keyword;
        setTimeout(()=>{
            //put the match or an empty array into FAKEIDB.results
            if(PRETENDDATA[keyword]){
                this.results = PRETENDDATA[keyword];
            }else{
                this.results = [];
            }
            //send back a custom complete event with the results property
            this.dispatchEvent( this.oncomplete() );
        }, 1000);
    }

    saveMatch (keyword, results) {
        //pretend to take a second
        this.keyword = keyword;
        setTimeout(()=>{
            //save the data in the pretend database store
            PRETENDDATA.results[keyword] = results;
            //fire the onsuccess event
            this.dispatchEvent( this.onsuccess() );
        }, 1000);
    }

    oncomplete() {
        //return a new custom complete event containing the results
        return new CustomEvent('complete', {detail: {results: this.results}});
    }

    onsuccess () {
        return new CustomEvent('success', {detail: {success: true, keyword: this.keyword}});
    }

}

const PRETENDDATA = {
    //this is the data in the database... pretend
    'Train': [{id:1, title: 'Train to Busan'}, {id:2, title: 'Trainwreck'}],
    'Star': [{id:3, title: 'Star Wars'}, {id:4, title: 'Star Trek'}],
    'Princess': [{id:5, title:'The Princess Bride'}, {id:6, title: 'The Princess and the Frog'}]
}

const FAKEAPI = {
    fetch: (keyword)=>{
        return new Promise((resolve, reject)=>{
            if(PRETENDDATA[keyword]){
                //return a match from PRETENDDATA
                let data = {results: PRETENDDATA[keyword]};
                setTimeout(resolve, 1000, data );
            }else{
                //return an empty array
                let data = {results: []};
                setTimeout(resolve, 1000, data);
            }
        });
    }
}