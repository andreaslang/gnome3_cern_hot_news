const Gio = imports.gi.Gio;
const Lang = imports.lang;

/**
 * Builds a diff between an old collection of news an a new one assuming both are in chronological order.
 */
const RSSItemDiff = new Lang.Class({
  Name: 'RSSItemDiff',

  _init: function(oldNews, newNews) {
    this._oldNews = oldNews;
    this._newNews = newNews;
  },

  getDiff: function()
  {
    var newsSincePreviousLoad;
    if (this._hasOldNews())
      newsSincePreviousLoad = this._newNews;
    else {
      newsSincePreviousLoad = this._getNewsNotInOldNews();
    }
    return newsSincePreviousLoad;
  },

  _hasOldNews: function () {
    return this._oldNews.length == 0;
  },

  _getNewsNotInOldNews: function() {
    var newsSincePreviousLoad = [];
    var mostRecentOldNewsGuid = this._oldNews[0].guid;
    var foundOldItem = false;
    for (let index = 0; index < this._newNews.length && !foundOldItem; index++) {
      let loadedNewsItem = this._newNews[index];
      if (mostRecentOldNewsGuid != loadedNewsItem.guid)
        newsSincePreviousLoad.push(loadedNewsItem);
      else
        foundOldItem = true;
    }
    return newsSincePreviousLoad;
  }

});

const RSSItemStore = new Lang.Class({
  Name: 'RSSItemStore',

  _init: function(storageLocation) {
    this._directory = Gio.file_new_for_path(storageLocation);
    this._file = Gio.file_new_for_path(storageLocation + '/store.json');
  },

  _ensureStorageExists: function () {
    this._ensureStorageDirectoryExists();
    this._ensureStorageFileExists();
  },

  _ensureStorageDirectoryExists: function () {
    if (!this._directory.query_exists(null, null)) {
      this._directory.make_directory(null, null);
    }
  },

  _ensureStorageFileExists: function () {
    if (!this._file.query_exists(null, null)) {
      var outputStream = this._file.create(Gio.FileCreateFlags.NONE, null);
      this._storeString(outputStream, JSON.stringify({news: []}, null, 2));
    }
  },

  compareAndGetNewsNotInStore: function(news)
  {
    var storedNews = this.loadNews();
    var newsDiff = new RSSItemDiff(storedNews, news);
    return newsDiff.getDiff();
  },

  loadNews: function() {
    this._ensureStorageExists();
    var content = this._file.load_contents(null);
    var json = JSON.parse(content[1]);
    return  json.news;
  },

  storeNews: function(news) {
    this._ensureStorageDirectoryExists();
    var jsonNews = JSON.stringify({news: news}, null, 2);
    var outputStream = this._file.replace(null, Gio.FileCreateFlags.NONE, null, null);
    this._storeString(outputStream, jsonNews);
  },

  _storeString: function (outputStream, string) {
    var dataOutputStream = new Gio.DataOutputStream({ base_stream: outputStream });
    dataOutputStream.put_string(string, null);
    dataOutputStream.close(null);
  }

});
