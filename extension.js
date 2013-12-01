const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const NewsSource = Extension.imports.newsSource;

let text, button;

function _hideHello() {
    Main.uiGroup.remove_actor(text);
    text = null;
}

function _onNewsLoaded(news) {
  var displayText;
  if (news.length > 0)
    displayText = news[0].title;
  else
    displayText = "No News Found";

  if (!text) {
      text = new St.Label({ style_class: 'helloworld-label', text: displayText });
      Main.uiGroup.add_actor(text);
  }
  else {
    text.text = displayText
  }

  text.opacity = 255;

  let monitor = Main.layoutManager.primaryMonitor;

  text.set_position(Math.floor(monitor.width / 2 - text.width / 2),
                    Math.floor(monitor.height / 2 - text.height / 2));

  Tweener.addTween(text,
                   { opacity: 0,
                     time: 10,
                     transition: 'easeOutQuad',
                     onComplete: _hideHello });    
}

function _showHello() {
  NewsSource.loadNews(_onNewsLoaded)
}



function init() {
    button = new St.Bin({ style_class: 'panel-button',
                          reactive: true,
                          can_focus: true,
                          x_fill: true,
                          y_fill: false,
                          track_hover: true });
    let icon = new St.Icon({ icon_name: 'system-run-symbolic',
                             style_class: 'system-status-icon' });

    button.set_child(icon);
    button.connect('button-press-event', _showHello);
}

function enable() {
    Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
    Main.panel._rightBox.remove_child(button);
}
