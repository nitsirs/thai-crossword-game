var scrollablePanel = this.rexUI.add
      .scrollablePanel({
        x: 625 / 2,
        y: 400,
        width: 500,
        height: 400,

        scrollMode: 0,

        background: this.rexUI.add.roundRectangle(
          0,
          0,
          2,
          2,
          10,
          COLOR_PRIMARY
        ),

        panel: {
          child: createGrid(this),
          mask: {
            mask: true,
            padding: 1,
          },
        },

        slider: {
          track: this.rexUI.add.roundRectangle(0, 0, 20, 10, 10, COLOR_DARK),
          thumb: this.rexUI.add.roundRectangle(0, 0, 0, 0, 13, COLOR_LIGHT),
          // position: 'left'
        },

        mouseWheelScroller: {
          focus: false,
          speed: 0.1,
        },

        header: this.rexUI.add.label({
          height: 30,

          orientation: 0,
          background: this.rexUI.add.roundRectangle(
            0,
            0,
            20,
            20,
            0,
            COLOR_PRIMARY
          ),
          text: this.add.text(0, 0, "Join a Game"),
        }),

        footer: this.rexUI.add.label({
          height: 30,

          orientation: 0,
          background: this.rexUI.add.roundRectangle(
            0,
            0,
            20,
            20,
            0,
            COLOR_PRIMARY
          ),
          text: this.add.text(0, 0, "2022 Nithiwat Sir"),
        }),

        space: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 10,

          panel: 10,
          header: 10,
          footer: 10,
        },
      })
      .layout();
    var print = this.add.text(0, 0, "");

    scrollablePanel
      .setChildrenInteractive()
      .on("child.click", function (child, pointer, event) {
        print.text += `Click ${child.text}\n`;
      })
      .on("child.pressstart", function (child, pointer, event) {
        print.text += `Press ${child.text}\n`;
      });


      var createGrid = function (scene) {
        // Create table body
        var sizer = scene.rexUI.add
          .fixWidthSizer({
            space: {
              left: 3,
              right: 3,
              top: 3,
              bottom: 3,
              item: 8,
              line: 8,
            },
          })
          .addBackground(scene.rexUI.add.roundRectangle(0, 0, 10, 10, 0, COLOR_DARK));
      
        for (var i = 0; i < 30; i++) {
          sizer.add(
            scene.rexUI.add.label({
              width: 60,
              height: 60,
      
              background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 14, COLOR_LIGHT),
              text: scene.add.text(0, 0, `${i}`, {
                fontSize: 18,
              }),
      
              align: "center",
              space: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10,
              },
            })
          );
        }
      
        return sizer;
      };