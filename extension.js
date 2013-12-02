const St = imports.gi.St;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const NewsImport = Extension.imports.newsImportModule;
const NewsLoader = NewsImport.NewsLoader;
const NewsXMLConverter = NewsImport.NewsXMLConverter;

let button, newsNotificationSource;

function _onNewsLoaded(news) {

  var testFile = Gio.file_new_for_path('.cern_hot_news');
  var out = testFile.replace(null, Gio.FileCreateFlags.NONE, null, null);
  let testFileS = new Gio.DataOutputStream({ base_stream: out});
  testFileS.put_string(JSON.stringify(news, null, 2), null);
  testFileS.close(null);

  if (news.length > 0)
  {
    var firstNewsItem = news[0];
    var notification = new MessageTray.Notification(
        newsNotificationSource,
        firstNewsItem.title,
        firstNewsItem.description + '\n' + firstNewsItem.link,
        {gicon: Gio.icon_new_for_string('c-white')}
    );
    newsNotificationSource.notify(notification);
  }
}

function _loadNews() {
  var newsLoader = new NewsLoader();
  newsLoader.onSuccess = function(newsXML) {
    var news = new NewsXMLConverter(newsXML).convertToNewsArray();
    _onNewsLoaded(news)
  };
  newsLoader.load();
}



function init() {
  let theme = imports.gi.Gtk.IconTheme.get_default();
  theme.append_search_path(Extension.path + "/icons");
  button = new St.Bin({ style_class: 'panel-button',
                        reactive: true,
                        can_focus: true,
                        x_fill: true,
                        y_fill: false,
                        track_hover: true });
  let icon = new St.Icon({ icon_name: 'c-white', style_class: 'system-status-icon' });

  button.set_child(icon);
  button.connect('button-press-event', _loadNews);
  newsNotificationSource = new NewsNotificationSource();
  Main.messageTray.add(newsNotificationSource);
}

function enable() {
    Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
    Main.panel._rightBox.remove_child(button);
}



const NewsNotificationSource = new Lang.Class({
  Name: 'NewsNotificationSource',
  Extends: MessageTray.Source,

  _init: function() {
    this.parent('CERN Hot News', 'cern-white');
    this.setTransient(true);
  },

  buildRightClickMenu: function() {
    let item;
    let rightClickMenu = new St.BoxLayout({
      name: 'summary-right-click-menu',
      vertical: true
    });

    item = new PopupMenu.PopupMenuItem(_("Remove"));
    item.connect('activate', Lang.bind(this, function() {
      this.destroy();
      this.emit('done-displaying-content', false);
    }));
    rightClickMenu.add(item.actor);
    return rightClickMenu;
  }
});
