let DB = null;

const APP = {
  dataList: null, //null means no data, [] means empty results
  nextPage: './results.html', //holds where we want to navigate
  keyword: null,
  init: () => {
    //page is loaded
    DB = new FAKEIDB(); //indexedDB.open() + onsuccess
    APP.addListeners();
    APP.pageSpecific();
  },
  addListeners: () => {
    let h2 = document.querySelector('header h2');
    h2.addEventListener('click', APP.doSearch); //form submit event
  },
  pageSpecific: () => {
    if (document.getElementById('home')) {
      //home page
    }
    if (document.getElementById('results')) {
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
    if (document.getElementById('suggest')) {
      //code for the suggested movies page when it loads
    }
  },
  doSearch: (ev) => {
    //clicked a span to do a search
    ev.preventDefault(); //if this were a link or form it would navigate so we want to stop that
    let span = ev.target.closest('span');
    if (span) {
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
  loadFromDB: () => {
    //used on the results page when loading the page
    DB.getMatch(APP.keyword);
    DB.addEventListener(
      'success',
      (ev) => {
        //successfully did the get
        //save the matches in APP.dataList
        APP.dataList = ev.detail.results;
        // ev.target.result inside DB success event
      },
      { once: true }
    ); //after doing a search in db
    DB.addEventListener(
      'complete',
      (ev) => {
        //transaction complete do the next step
        APP.buildList();
      },
      { once: true }
    ); //after doing a search in db
  },
  findInDBorFetch: (keyword) => {
    //do search in db for match after clicking search link
    console.log(`check db for ${keyword}`);
    DB.getMatch(keyword);
    // let tx = DB.createTransaction(name)
    //tx.oncomplete = function(){
    //next step function
    //}
    // let store = tx.objectStore(name)
    // let req = store.get(keyword)  ||  store.add(data)
    // req.onsuccess = function(ev){
    // got the data from the database  ev.target.result
    // or add we don't need to do much here
    // }  =>  APP.dbMatchResults
    //this will trigger the `complete` event that will call matchFound
    DB.addEventListener(
      'success',
      (ev) => {
        // store.get is finished.
        console.log(`results from db ${ev.detail.results}`);
        APP.dataList = ev.detail.results; //ev.target.result
      },
      { once: true }
    ); //after doing a search in db
    DB.addEventListener(
      'complete',
      (ev) => {
        //transaction complete
        APP.dbMatchResults();
      },
      { once: true }
    ); //after doing a search in db
  },
  saveToDB: (keyword, results) => {
    //save in db
    console.log(`save fetch results for ${keyword} in db`);
    DB.saveMatch(keyword, results);
    DB.addEventListener(
      'success',
      (ev) => {
        //successfully saved the results in the database
      },
      { once: true }
    ); //after saving a result in db
    DB.addEventListener(
      'complete',
      (ev) => {
        //transaction is complete do next step
        APP.dataSaved();
      },
      { once: true }
    ); //after saving a result in db
  },
  doFetch: (keyword) => {
    //do the fake call
    console.log(`do a fetch call for ${keyword}`);

    FAKEAPI.fetch(keyword)
      .then((response) => {
        console.log(`fetch response `, response.results);
        return response.results;
      })
      .then((results) => {
        //save the results in APP.dataList
        APP.dataList = results;
        //could be an empty array
        //if empty we won't save it in this example... you can for the real project if you want
        if (results.length === 0) {
          document.querySelector('main').innerHTML =
            '<h1>No matches for search.</h1>';
        } else {
          APP.saveToDB(keyword, results);
        }
      });
  },
  dbMatchResults: (ev) => {
    //DB match results
    if (APP.dataList.length === 0) {
      //need to do fetch
      APP.doFetch(APP.keyword);
    } else {
      //there is a match so navigate
      APP.navigate(APP.keyword);
    }
  },
  dataSaved: (ev) => {
    //result saved in DB
    console.log(`data saved in db ${ev.detail}`);
    APP.navigate(ev.detail.keyword);
  },
  buildList: () => {
    console.log('build html');
    let main = document.querySelector('main');
    let df = document.createDocumentFragment();
    APP.dataList.forEach((item) => {
      let p = document.createElement('p');
      p.textContent = item.title;
      p.setAttribute('data-key', item.id);
      df.append(p);
    });
    main.append(df);
  },
  navigate: (keyword) => {
    let url = `${APP.nextPage}?keyword=${keyword}`;
    console.log(`navigate to ${url}`);
    window.location = url;
  },
};

document.addEventListener('DOMContentLoaded', APP.init);

//CODE below here is just for replicating a fake DB, and a fake API not needed for project

class FAKEIDB extends EventTarget {
  //pretend this is the real indexedDB object in the browser
  constructor() {
    super();
    this.results = null;
    this.keyword = null;
  }

  getMatch(keyword) {
    //pretend to take a second
    this.keyword = keyword;
    this.results = null;
    setTimeout(() => {
      //put the match or an empty array into FAKEIDB.results
      if (FAKEdbDATA[keyword]) {
        this.results = FAKEdbDATA[keyword];
      } else {
        this.results = [];
      }
      //fire the onsuccess event and then the oncomplete event
      //the data will be inside the success event
      this.dispatchEvent(this.onsuccess());
      this.dispatchEvent(this.oncomplete());
    }, 1000);
  }

  saveMatch(keyword, results) {
    //pretend to take a second
    this.keyword = keyword;
    this.results = null;
    setTimeout(() => {
      //save the data in the pretend database store
      FAKEdbDATA[keyword] = results;
      //fire the onsuccess event and then the oncomplete event
      //the data will be inside the success event
      this.dispatchEvent(this.onsuccess());
      this.dispatchEvent(this.oncomplete());
    }, 1000);
  }

  oncomplete() {
    //return a new custom complete event containing the results
    return new CustomEvent('complete', { detail: { complete: true } });
  }

  onsuccess() {
    return new CustomEvent('success', {
      detail: { results: this.results, success: true, keyword: this.keyword },
    });
  }
}

const FAKEdbDATA = {
  //this is the data in the database... pretend
  Train: [
    { id: 1, title: 'Train to Busan' },
    { id: 2, title: 'Trainwreck' },
  ],
  Princess: [
    { id: 5, title: 'The Princess Bride' },
    { id: 6, title: 'The Princess and the Frog' },
  ],
};

const FAKEAPI = {
  fetch: (keyword) => {
    return new Promise((resolve, reject) => {
      if (FAKEapiDATA[keyword]) {
        //return a match from FAKEapiDATA
        let data = { results: FAKEapiDATA[keyword] };
        setTimeout(resolve, 1000, data);
      } else {
        //return an empty array
        let data = { results: [] };
        setTimeout(resolve, 1000, data);
      }
    });
  },
};

const FAKEapiDATA = {
  //this is the data in the database... pretend
  Train: [
    { id: 1, title: 'Train to Busan' },
    { id: 2, title: 'Trainwreck' },
  ],
  Star: [
    { id: 3, title: 'Star Wars' },
    { id: 4, title: 'Star Trek' },
  ],
  Princess: [
    { id: 5, title: 'The Princess Bride' },
    { id: 6, title: 'The Princess and the Frog' },
  ],
  Ground: [
    { id: 7, title: 'Groundhog Day' },
    { id: 8, title: 'Underground' },
  ],
  Wheel: [
    { id: 9, title: 'Wonder' },
    { id: 10, title: 'Wonder Woman' },
  ],
};
