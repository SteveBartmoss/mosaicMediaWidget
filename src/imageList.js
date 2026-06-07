import Gio from 'gi://Gio';

export class ImageList {

    constructor(extensionPath) {
        this.path = extensionPath;
        this.images = [];
    }

    loadImages() {

        this.images = [];

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

    shuffle() {

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

    getImages() {
        return [...this.images];
    }

}