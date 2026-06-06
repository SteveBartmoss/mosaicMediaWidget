import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

export default class ExampleExtension extends Extension {
    enable() {

        this.currentIndex = 0;
        this.images = [];

        this.loadImages();

        if(this.images.length === 0){
            console.error('MOSAI: No se encontraron imágenes');
            return;
        }

        console.log('MOSAI: enable() ejecutado');

        this.widget = new St.Widget({
            style: this.buildImageStyle(this.images[0])
        });

        console.log('MOSAI: widget creado');

        Main.layoutManager.addChrome(this.widget);

        console.log('MOSAI: widget agregado');

        this.widget.set_position(100, 100);

        this.widget.set_position(100, 100);

        this.timeoutId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            5,
            () => {

                this.nextImage();

                return GLib.SOURCE_CONTINUE;
            }
        );

        console.log('MOSAI: posición establecida');

        // Create a panel button
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);

        // Add an icon
        const icon = new St.Icon({
            icon_name: 'face-laugh-symbolic',
            style_class: 'system-status-icon',
        });
        this._indicator.add_child(icon);

        // Add the indicator to the panel
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    loadImages() {

        const imageDir = Gio.File.new_for_path(
            `${this.path}/img`
        );

        const enumerator = imageDir.enumerate_children(
            'standard::*',
            Gio.FileQueryInfoFlags.NONE,
            null
        );

        let info;

        while ((info = enumerator.next_file(null)) !== null) {

            const filename = info.get_name();

            const lower = filename.toLowerCase();

            if (
                lower.endsWith('.jpg') ||
                lower.endsWith('.jpeg') ||
                lower.endsWith('.png') ||
                lower.endsWith('.webp')
            ) {
                this.images.push(
                    `${this.path}/img/${filename}`
                );
            }
        }

        console.log(
            `MOSAI: ${this.images.length} imágenes encontradas`
        );

    }

    buildImageStyle(imagePath) {

        return `
            background-image: url("${imagePath}");
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            width: 300px;
            height: 300px;
        `;
    }

    nextImage() {

        this.currentIndex++;

        if (this.currentIndex >= this.images.length) {
            this.currentIndex = 0;
        }

        const image = this.images[this.currentIndex];

        console.log(`MOSAI: mostrando ${image}`);

        this.widget.set_style(
            this.buildImageStyle(image)
        );
    }


    disable() {

        console.log('MOSAI: disable() ejecutado');

        if (this.timeoutId) {
            GLib.Source.remove(this.timeoutId);
            this.timeoutId = null;
        }

        this.widget?.destroy();
        this.widget = null;

        this.images = [];

        this._indicator?.destroy();
        this._indicator = null;
    }
}