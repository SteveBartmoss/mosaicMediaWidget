import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export class ImageWidget {

    buildImageStyle(path) {
        return `
            background-image: url("${path}");
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            border-radius: 10px;
        `;
    }

    createWidget(img) {

        this.widget = new St.Widget({
            style: this.buildImageStyle(img)
        });

        this.widget.set_size(200,200);

        Main.layoutManager.addChrome(
            this.widget
        );

        this.widget.set_position(100,100);

        return this.widget;
    }

    updateImage(path) {

        if (!this.widget)
            return;

        this.widget.set_style(
            this.buildImageStyle(path)
        );

        this.widget.set_size(200,200);
        
    }

    destroy() {
        this.widget?.destroy();
        this.widget = null;
    }
}
