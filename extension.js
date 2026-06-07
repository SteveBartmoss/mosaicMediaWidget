import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { ImageWidget } from './src/imageWidget.js';
import { ImageList } from './src/imageList.js';

export default class ExampleExtension extends Extension {
    enable() {

        this.imageWidget = new ImageWidget();


        this.imageList = new ImageList(this.path)

        this.imageList.loadImages();
        this.imageList.shuffle();

        this.images = this.imageList.getImages();

        this.currentIndex = 0;
        this.paused = false;

        if (this.images.length === 0) {
            console.error('MOSAI: No se encontraron imágenes');
            return;
        }

        this.createWidget();
        this.createMenu();

        this.startSlideshow();

        this.startFolderWatcher();

        console.log('MOSAI: widget agregado');

    }

    createWidget() {

        this.widget =
            this.imageWidget.createWidget(
                this.images[this.currentIndex]
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

    reloadImages() {

        this.imageList.loadImages();
        this.imageList.shuffle();

        this.images = this.imageList.getImages();        

        if (this.images.length === 0) {

            console.warn(
                'MOSAI: carpeta vacía'
            );

            return;
        }

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

        this.imageWidget.updateImage(
            this.images[this.currentIndex]
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

        this.imageWidget?.destroy();

        this._indicator?.destroy();

        this._indicator = null;
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