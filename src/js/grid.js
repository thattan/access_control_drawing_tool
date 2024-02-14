var grid = {
    setGrid(_canvas, imageUrl) {
        _canvas.setBackgroundImage(imageUrl, () => {}, { objectCaching: false });
    },    
}

export default grid;
