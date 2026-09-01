const {
    generateRooms,
    ROOM_TYPE_INFO
} = require("./src/game/dungeon");

function test() {
    const rooms = generateRooms(3);

    console.log("Generated Rooms:\n");

    rooms.forEach((room, index) => {
        const info = ROOM_TYPE_INFO[room.type];

        console.log(
            `${index + 1}. ${info.emoji} ${info.name}`
        );

        console.log(
            `   ${info.description}`
        );

        console.log(
            `   ID: ${room.id}\n`
        );
    });
}

test();