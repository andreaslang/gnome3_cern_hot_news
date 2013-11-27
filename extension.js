
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Soup = imports.gi.Soup;

let text, button;

function _hideHello() {
    Main.uiGroup.remove_actor(text);
    text = null;
}

function _onRSSLoaded(body) {
  var xmlDoc = new XML(body);
  print("done");

  if (!text) {
      text = new St.Label({ style_class: 'helloworld-label', text: xmlDoc.channel.item[0].title.toString() });
      Main.uiGroup.add_actor(text);
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
    
    const _httpSession = new Soup.SessionAsync();
    Soup.Session.prototype.add_feature.call(_httpSession, new Soup.ProxyResolverDefault());
    var request = Soup.Message.new('GET', 'http://cernalerts.web.cern.ch/cernalerts/?feed=cern%20hot%20news');
    _httpSession.queue_message(request, function (_httpSession, message) {
                                  if (message.status_code !== 200) {
                                    print("Error" + message.status_code);
                                    return;
                                  }
                                  var weatherXML = request.response_body.data;
                                  print("asdasdsa");
                                  _onRSSLoaded(weatherXML.replace(/.*<\?xml[^>]*>/, ''));
                                });
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
