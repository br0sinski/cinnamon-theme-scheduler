const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;

class ThemeSchedulerApplet extends Applet.IconApplet {
    constructor(orientation, panel_height, instance_id) {
        super(orientation, panel_height, instance_id);
        
        this.set_applet_icon_name("preferences-desktop-theme");
        this.set_applet_tooltip(_("Theme Scheduler"));
        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);
        this._buildMenu();
    }
    
    _buildMenu() {        
        // Separator example
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        
        // Settings button
        let settingsItem = new PopupMenu.PopupMenuItem("Settings");
        settingsItem.connect('activate', () => {
            this._openSettings();
        });
        this.menu.addMenuItem(settingsItem);
    }
    
    _openSettings() {
        global.log("Opening Theme Scheduler settings");
    }
    
    on_applet_clicked(event) {
        this.menu.toggle();
    }
}

function main(metadata, orientation, panel_height, instance_id) {
    return new ThemeSchedulerApplet(orientation, panel_height, instance_id);
}