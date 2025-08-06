const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

class ThemeSchedulerApplet extends Applet.IconApplet {
    constructor(orientation, panel_height, instance_id) {
        super(orientation, panel_height, instance_id);
        
        this.set_applet_icon_name("preferences-desktop-theme");
        this.set_applet_tooltip(_("Theme Scheduler"));
        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);

        this.themes = { 
            gtk: [],
            cinnamon: [],
            icons: [],
            cursors: []
        };

        this._scanAllThemes();
        this._buildMenu();
    }

    _scanAllThemes() {
        const allPaths = [
            GLib.get_home_dir() + "/.themes",
            GLib.get_home_dir() + "/.local/share/themes", 
            "/usr/share/themes",
            GLib.get_home_dir() + "/.icons",
            GLib.get_home_dir() + "/.local/share/icons",
            "/usr/share/icons"
        ];

        for(let path of allPaths) {
            this._scanPath(path);
        }

        global.log(`Found themes - GTK: ${this.themes.gtk.length}, Cinnamon: ${this.themes.cinnamon.length}, Icons: ${this.themes.icons.length}, Cursors: ${this.themes.cursors.length}`);
    }

    _scanPath(basePath) {
        try {
            let dir = Gio.File.new_for_path(basePath);
            if(!dir.query_exists(null)) return;
            
            let enumerator = dir.enumerate_children("standard::name,standard::type", 
                Gio.FileQueryInfoFlags.NONE, null);
            
            let info;
            while ((info = enumerator.next_file(null)) != null) {
                if (info.get_file_type() === Gio.FileType.DIRECTORY) {
                    let themeName = info.get_name();
                    let themePath = basePath + "/" + themeName;
                    let hasGtk = this._hasGtkTheme(themePath);
                    let hasCinnamon = this._hasCinnamonTheme(themePath);
                    let hasIcons = this._hasIconTheme(themePath);
                    let hasCursors = this._hasCursorTheme(themePath);
                    
                    // Add to appropriate categories - to avoid dupliacates !
                    if (hasGtk && !this.themes.gtk.includes(themeName)) {
                        this.themes.gtk.push(themeName);
                    }
                    if (hasCinnamon && !this.themes.cinnamon.includes(themeName)) {
                        this.themes.cinnamon.push(themeName);
                    }
                    if (hasIcons && !this.themes.icons.includes(themeName)) {
                        this.themes.icons.push(themeName);
                    }
                    if (hasCursors && !this.themes.cursors.includes(themeName)) {
                        this.themes.cursors.push(themeName);
                    }
                }
            }
        } catch (e) {
            global.log(`Error scanning ${basePath}: ${e.message}`);
        }
    }
/*

The following methods are checks if a current path contains certain files, in order to determine if a folder is a GTK/Cinnamon Shell/Icon or Mouse Theme.

*/
    _hasGtkTheme(themePath) {
        let gtkPaths = [
            themePath + "/gtk-2.0",
            themePath + "/gtk-3.0", 
            themePath + "/gtk-4.0",
            themePath + "/gtk-2.0/gtkrc",
            themePath + "/gtk-3.0/gtk.css",
            themePath + "/gtk-4.0/gtk.css"
        ];
        for (let path of gtkPaths) {
            let file = Gio.File.new_for_path(path);
            if (file.query_exists(null)) {
                return true;
            }
        }
        return false;
    }

    _hasCinnamonTheme(themePath) {
        let cinnamonPaths = [
            themePath + "/cinnamon",
            themePath + "/cinnamon/cinnamon.css"
        ];
        
        for (let path of cinnamonPaths) {
            let file = Gio.File.new_for_path(path);
            if (file.query_exists(null)) {
                return true;
            }
        }
        return false;
    }

    _hasIconTheme(themePath) {
        let iconFile = Gio.File.new_for_path(themePath + "/index.theme");
        return iconFile.query_exists(null);
    }

    _hasCursorTheme(themePath) {
        let cursorPaths = [
            themePath + "/cursors",
            themePath + "/cursor.theme"
        ];
        
        for (let path of cursorPaths) {
            let file = Gio.File.new_for_path(path);
            if (file.query_exists(null)) {
                return true;
            }
        }
        return false;
    }
    
    _buildMenu() {
        let headerItem = new PopupMenu.PopupMenuItem("Theme Scheduler", { reactive: false });
        this.menu.addMenuItem(headerItem);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        
        if (this.themes.gtk.length > 0) {
            this._addThemeSubmenu("GTK Themes", this.themes.gtk, "gtk");
        }
        
        if (this.themes.cinnamon.length > 0) {
            this._addThemeSubmenu("Cinnamon Themes", this.themes.cinnamon, "cinnamon");
        }
        
        if (this.themes.icons.length > 0) {
            this._addThemeSubmenu("Icon Themes", this.themes.icons, "icons");
        }
        
        if (this.themes.cursors.length > 0) {
            this._addThemeSubmenu("Cursor Themes", this.themes.cursors, "cursors");
        }
        
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        let settingsItem = new PopupMenu.PopupMenuItem("Settings");
        settingsItem.connect('activate', () => {
            this._openSettings();
        });
        this.menu.addMenuItem(settingsItem);
    }

    _addThemeSubmenu(label, themes, category) {
        let submenu = new PopupMenu.PopupSubMenuMenuItem(label);        
        themes.sort();
        
        for (let theme of themes) {
            let themeItem = new PopupMenu.PopupMenuItem(theme);
            themeItem.connect('activate', () => {
                this._applyTheme(category, theme);
            });
            submenu.menu.addMenuItem(themeItem);
        }
        
        this.menu.addMenuItem(submenu);
    }

    _applyTheme(category, themeName) {
        try {
            switch(category) {
                case 'gtk':
                    GLib.spawn_command_line_async(`gsettings set org.gnome.desktop.interface gtk-theme '${themeName}'`);
                    global.log(`Applied GTK theme: ${themeName}`);
                    break;
                case 'cinnamon':
                    GLib.spawn_command_line_async(`gsettings set org.cinnamon.theme name '${themeName}'`);
                    global.log(`Applied Cinnamon theme: ${themeName}`);
                    break;
                case 'icons':
                    GLib.spawn_command_line_async(`gsettings set org.gnome.desktop.interface icon-theme '${themeName}'`);
                    global.log(`Applied Icon theme: ${themeName}`);
                    break;
                case 'cursors':
                    GLib.spawn_command_line_async(`gsettings set org.gnome.desktop.interface cursor-theme '${themeName}'`);
                    global.log(`Applied Cursor theme: ${themeName}`);
                    break;
            }
        } catch (e) {
            global.log(`Error applying ${category} theme ${themeName}: ${e.message}`);
        }
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