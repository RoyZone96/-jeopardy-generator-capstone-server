CREATE TABLE boards (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id INTEGER NOT NULL,
    board_title TEXT NOT NULL,
    times_played INTEGER NOT NULL,
    date_created DATE,
    date_updated DATE
);