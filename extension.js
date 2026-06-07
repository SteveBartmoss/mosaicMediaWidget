import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export default class ExampleExtension extends Extension {
    enable() {

        this.images = [];
        this.currentIndex = 0;
        this.paused = false;

        this.loadImages();

        if (this.images.length === 0) {
            console.error('MOSAI: No se encontraron imágenes');
            return;
        }

        this.shuffleImages();

        this.createWidget();
        this.createMenu();

        this.startSlideshow();

        this.startFolderWatcher();

        console.log('MOSAI: widget agregado');

    }

    createWidget() {

        this.widget = new St.Widget({
            style: this.buildImageStyle(
                this.images[this.currentIndex]
            )
        });

        Main.layoutManager.addChrome(
            this.widget
        );

        this.widget.set_position(
            100,
            100
        );
    }

    createMenu() {

        this._indicator =
            new PanelMenu.Button(
                0,
                'Mosai'
            );

        const icon = new St.Icon({
            icon_name: 'image-x-generic-symbolic',
            style_class: 'system-status-icon',
        });

        this._indicator.add_child(icon);

        Main.panel.addToStatusArea(
            this.uuid,
            this._indicator
        );

        const nextItem =
            new PopupMenu.PopupMenuItem(
                'Next Image'
            );

        nextItem.connect(
            'activate',
            () => this.nextImage()
        );

        this._indicator.menu.addMenuItem(
            nextItem
        );

        const prevItem =
            new PopupMenu.PopupMenuItem(
                'Previous Image'
            );

        prevItem.connect(
            'activate',
            () => this.previousImage()
        );

        this._indicator.menu.addMenuItem(
            prevItem
        );

        const pauseItem =
            new PopupMenu.PopupMenuItem(
                'Pause'
            );

        pauseItem.connect(
            'activate',
            () => {
                this.paused = true;
            }
        );

        this._indicator.menu.addMenuItem(
            pauseItem
        );

        const resumeItem =
            new PopupMenu.PopupMenuItem(
                'Resume'
            );

        resumeItem.connect(
            'activate',
            () => {
                this.paused = false;
            }
        );

        this._indicator.menu.addMenuItem(
            resumeItem
        );

        const reloadItem =
            new PopupMenu.PopupMenuItem(
                'Reload Folder'
            );

        reloadItem.connect(
            'activate',
            () => {
                this.reloadImages();
            }
        );

        this._indicator.menu.addMenuItem(
            reloadItem
        );
    }

    shuffleImages() {

        for (
            let i = this.images.length - 1;
            i > 0;
            i--
        ) {

            const j =
                Math.floor(
                    Math.random() * (i + 1)
                );

            [
                this.images[i],
                this.images[j]
            ] = [
                    this.images[j],
                    this.images[i]
                ];
        }
    }

    reloadImages() {

        this.images = [];

        this.loadImages();

        if (this.images.length === 0) {

            console.warn(
                'MOSAI: carpeta vacía'
            );

            return;
        }

        this.shuffleImages();

        this.currentIndex = 0;

        this.updateImage();
    }

    startSlideshow() {

        this.timeoutId =
            GLib.timeout_add_seconds(
                GLib.PRIORITY_DEFAULT,
                5,
                () => {

                    if (!this.paused) {
                        this.nextImage();
                    }

                    return GLib.SOURCE_CONTINUE;
                }
            );
    }

    previousImage() {

        this.currentIndex--;

        if (
            this.currentIndex < 0
        ) {
            this.currentIndex =
                this.images.length - 1;
        }

        this.updateImage();
    }

    updateImage() {

        this.widget.set_style(
            this.buildImageStyle(
                this.images[
                this.currentIndex
                ]
            )
        );
    }

    disable() {

        console.log(
            'MOSAI: disable() ejecutado'
        );

        this.images = [];

        if (
            this.timeoutId
        ) {

            GLib.Source.remove(
                this.timeoutId
            );

            this.timeoutId = null;
        }

        this.monitor?.cancel();

        this.monitor = null;

        this.widget?.destroy();

        this.widget = null;

        this._indicator?.destroy();

        this._indicator = null;
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

    buildImageStyle(path) {

        return `
            background-image:
                url("${path}");

            background-size:
                contain;

            background-repeat:
                no-repeat;

            background-position:
                center;

            width: 300px;
            height: 300px;
        `;
    }

    nextImage() {

        this.currentIndex++;

        if (this.currentIndex >= this.images.length) {
            this.currentIndex = 0;
        }

        console.log(
            `MOSAI: mostrando ${this.images[this.currentIndex]
            }`
        );

        this.updateImage();
    }

    startFolderWatcher() {

        const folder =
            Gio.File.new_for_path(
                `${this.path}/img`
            );

        this.monitor =
            folder.monitor_directory(
                Gio.FileMonitorFlags.NONE,
                null
            );

        this.reloadTimeout = null;

        this.monitor.connect(
            'changed',
            () => {

                if (this.reloadTimeout)
                    return;

                this.reloadTimeout =
                    GLib.timeout_add_seconds(
                        GLib.PRIORITY_DEFAULT,
                        1,
                        () => {

                            this.reloadTimeout =
                                null;

                            this.reloadImages();

                            return GLib.SOURCE_REMOVE;
                        }
                    );
            }
        );
    }

}