import math
import random
import sys
from dataclasses import dataclass

import pygame

# ============================================================
# TERRACRAFT - Python / Pygame
# FIXED VERSION
# ============================================================

pygame.init()
pygame.mixer.quit()

WIDTH, HEIGHT = 1280, 720
FPS = 60
TILE = 32
WORLD_W, WORLD_H = 240, 90
GRAVITY = 0.55

screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Terracraft — Forest Survivor")
clock = pygame.time.Clock()

FONT = pygame.font.SysFont("consolas", 18)
SMALL = pygame.font.SysFont("consolas", 14)
BIG = pygame.font.SysFont("consolas", 34, bold=True)
TITLE = pygame.font.SysFont("consolas", 52, bold=True)

random.seed(12)


# ============================================================
# HELPERS
# ============================================================

def clamp(v, a, b):
    return max(a, min(b, v))


def text(s, x, y, font=FONT, color=(235, 240, 245), anchor="topleft"):
    surf = font.render(str(s), True, color)
    rect = surf.get_rect()
    setattr(rect, anchor, (x, y))
    screen.blit(surf, rect)


def rect_alpha(surface, color, rect, radius=0):
    # FIX:
    # pygame.Rect dibutuhkan karena draw_ui menggunakan tuple.
    rect = pygame.Rect(rect)

    layer = pygame.Surface(
        (rect.width, rect.height),
        pygame.SRCALPHA
    )

    pygame.draw.rect(
        layer,
        color,
        layer.get_rect(),
        border_radius=radius
    )

    surface.blit(layer, rect.topleft)


# ============================================================
# WORLD
# ============================================================

BLOCKS = {
    "air": None,
    "grass": (79, 139, 70),
    "dirt": (115, 78, 48),
    "stone": (86, 91, 96),
    "iron": (125, 102, 88),
    "gold": (190, 156, 58),
    "wood": (102, 67, 40),
    "leaves": (48, 112, 57),
}

world = [[None for _ in range(WORLD_W)] for _ in range(WORLD_H)]
surface_y = []

for x in range(WORLD_W):
    h = 31 + int(
        math.sin(x * 0.075) * 5
        + math.sin(x * 0.19) * 2
        + math.sin(x * 0.013) * 7
    )

    h = clamp(h, 22, 44)
    surface_y.append(h)


for x in range(WORLD_W):
    sy = surface_y[x]

    for y in range(sy, WORLD_H):
        if y == sy:
            world[y][x] = "grass"
        elif y < sy + 5:
            world[y][x] = "dirt"
        else:
            world[y][x] = "stone"


# Ore veins
for _ in range(150):
    x = random.randint(3, WORLD_W - 4)
    y = random.randint(36, WORLD_H - 8)

    ore = random.choice([
        "iron",
        "iron",
        "gold"
    ])

    for dx in range(random.randint(1, 3)):
        for dy in range(random.randint(1, 3)):
            xx = x + dx
            yy = y + dy

            if (
                0 <= xx < WORLD_W
                and 0 <= yy < WORLD_H
                and world[yy][xx] == "stone"
            ):
                world[yy][xx] = ore


# Trees
for x in range(5, WORLD_W - 5):

    if random.random() < 0.08:

        sy = surface_y[x]
        trunk = random.randint(4, 7)

        for yy in range(sy - trunk, sy):
            if yy >= 1:
                world[yy][x] = "wood"

        for dx in range(-3, 4):
            for dy in range(-2, 3):

                if abs(dx) + abs(dy) < 5:

                    xx = x + dx
                    yy = sy - trunk + dy

                    if (
                        0 <= xx < WORLD_W
                        and 0 <= yy < WORLD_H
                        and world[yy][xx] is None
                    ):
                        world[yy][xx] = "leaves"


# Spawn area
spawn_x = 25
spawn_ground = surface_y[spawn_x]

for x in range(spawn_x - 5, spawn_x + 6):

    for y in range(spawn_ground - 9, spawn_ground):

        if (
            0 <= x < WORLD_W
            and 0 <= y < WORLD_H
        ):
            world[y][x] = None


# ============================================================
# PARTICLES
# ============================================================

particles = []


@dataclass
class Particle:
    x: float
    y: float
    vx: float
    vy: float
    life: float
    size: int
    color: tuple


def burst(x, y, color, count=10, power=3):

    for _ in range(count):

        a = random.random() * math.tau
        sp = random.random() * power

        particles.append(
            Particle(
                x,
                y,
                math.cos(a) * sp,
                math.sin(a) * sp,
                random.uniform(0.3, 0.8),
                random.randint(2, 5),
                color
            )
        )


def update_particles(dt):

    for p in particles[:]:

        p.x += p.vx
        p.y += p.vy
        p.vy += 0.12
        p.life -= dt

        if p.life <= 0:
            particles.remove(p)


# ============================================================
# ENEMIES
# ============================================================

@dataclass
class Enemy:
    x: float
    y: float
    w: int
    h: int
    hp: int
    max_hp: int
    speed: float
    kind: str
    vx: float = 0
    vy: float = 0
    hurt: float = 0
    cooldown: float = 0


enemies = []


# ============================================================
# PLAYER
# ============================================================

@dataclass
class Player:
    x: float
    y: float
    vx: float = 0
    vy: float = 0
    hp: float = 100
    max_hp: float = 100
    mana: float = 50
    max_mana: float = 50
    stamina: float = 100
    max_stamina: float = 100
    grounded: bool = False
    jumps: int = 0
    attack_cd: float = 0
    invuln: float = 0
    dodge: float = 0
    facing: int = 1


player = Player(
    spawn_x * TILE,
    (spawn_ground - 3) * TILE
)


# ============================================================
# INVENTORY
# ============================================================

items = [
    "Wood",
    "Stone",
    "Iron",
    "Gold",
    "Torch",
    "Potion",
    "Sword",
    "Bow",
    "Wand"
]

counts = {
    "Wood": 32,
    "Stone": 18,
    "Iron": 6,
    "Gold": 2,
    "Torch": 12,
    "Potion": 3,
    "Arrow": 10
}

selected = 6
inventory_open = False
paused = False


# ============================================================
# CAMERA / TIME
# ============================================================

cam_x = 0.0
cam_y = 0.0

world_time = 8.5 * 60
day = 1

boss = None
boss_active = False
boss_defeated = False

announcement = ""
announcement_timer = 0


def say(msg, duration=2.5):

    global announcement
    global announcement_timer

    announcement = msg
    announcement_timer = duration


def time_string():

    total = int(world_time) % (24 * 60)

    h = total // 60
    m = total % 60

    ap = "AM" if h < 12 else "PM"

    hh = h % 12 or 12

    return f"{hh:02d}:{m:02d} {ap}"


# ============================================================
# COLLISION
# ============================================================

def solid_at(tx, ty):

    if (
        tx < 0
        or tx >= WORLD_W
        or ty < 0
        or ty >= WORLD_H
    ):
        return True

    return world[ty][tx] is not None


def collide_box(x, y, w, h):

    left = int(x // TILE)
    right = int((x + w - 1) // TILE)

    top = int(y // TILE)
    bottom = int((y + h - 1) // TILE)

    for ty in range(top, bottom + 1):

        for tx in range(left, right + 1):

            if solid_at(tx, ty):
                return True

    return False


def move_entity(obj, w, h):

    obj.x += obj.vx

    if collide_box(obj.x, obj.y, w, h):

        step = 1 if obj.vx > 0 else -1

        while collide_box(obj.x, obj.y, w, h):
            obj.x -= step

        obj.vx = 0


    obj.y += obj.vy

    if collide_box(obj.x, obj.y, w, h):

        if obj.vy > 0:

            obj.y = (
                int((obj.y + h) // TILE) * TILE
                - h
            )

            if hasattr(obj, "grounded"):
                obj.grounded = True

        else:

            obj.y = (
                int(obj.y // TILE + 1)
                * TILE
            )

        obj.vy = 0

    elif hasattr(obj, "grounded"):

        obj.grounded = False


# ============================================================
# SPAWN ENEMY
# ============================================================

def spawn_enemy():

    side = random.choice([-1, 1])

    x = (
        player.x / TILE
        + side * random.randint(13, 25)
    )

    x = clamp(
        x,
        4,
        WORLD_W - 4
    )

    sy = surface_y[int(x)]

    kind = random.choice([
        "slime",
        "zombie",
        "wraith"
    ])

    if kind == "slime":

        hp = 45
        speed = 0.8
        w = 24
        h = 20

    elif kind == "zombie":

        hp = 75
        speed = 0.55
        w = 25
        h = 48

    else:

        hp = 55
        speed = 1.1
        w = 28
        h = 32

    enemies.append(
        Enemy(
            x * TILE,
            (sy - 2) * TILE,
            w,
            h,
            hp,
            hp,
            speed,
            kind
        )
    )


# ============================================================
# COMBAT
# ============================================================

def damage_enemy(e, dmg, knock=4):

    e.hp -= dmg
    e.hurt = 0.12

    e.vx += player.facing * knock

    burst(
        e.x + e.w / 2,
        e.y + e.h / 2,
        (240, 220, 120),
        8,
        2.5
    )


def attack():

    if player.attack_cd > 0:
        return

    if player.dodge > 0:
        return

    player.attack_cd = 0.28

    reach = 58

    cx = (
        player.x
        + player.facing * 26
    )

    cy = player.y + 24


    for e in enemies[:]:

        if (
            abs((e.x + e.w / 2) - cx) < reach
            and abs((e.y + e.h / 2) - cy) < 42
        ):

            damage_enemy(e, 28, 5)

            if e.hp <= 0:

                burst(
                    e.x,
                    e.y,
                    (130, 230, 120),
                    15,
                    3
                )

                enemies.remove(e)


    if boss_active and boss:

        if (
            abs((boss["x"] + 45) - cx) < 90
            and abs((boss["y"] + 50) - cy) < 90
        ):

            boss["hp"] -= 32
            boss["hurt"] = 0.1

            burst(
                boss["x"] + 45,
                boss["y"] + 50,
                (255, 180, 80),
                18,
                4
            )


projectiles = []


def shoot():

    if player.attack_cd > 0:
        return

    if counts.get("Arrow", 0) <= 0:
        counts["Arrow"] = 10

    counts["Arrow"] -= 1

    player.attack_cd = 0.45

    projectiles.append({
        "x": player.x + 16,
        "y": player.y + 22,
        "vx": player.facing * 10,
        "life": 2.0
    })


# ============================================================
# BOSS
# ============================================================

def summon_boss():

    global boss
    global boss_active

    if boss_active:
        return

    boss_active = True

    boss = {
        "x": player.x + 280,
        "y": player.y - 150,
        "hp": 3000,
        "max_hp": 3000,
        "vx": 0,
        "vy": 0,
        "phase": 1,
        "hurt": 0,
        "cooldown": 1.0
    }

    say(
        "ANCIENT FOREST GUARDIAN AWAKENS!",
        4
    )


# ============================================================
# UPDATE
# ============================================================

spawn_timer = 0


def update_game(dt):

    global world_time
    global day
    global spawn_timer
    global announcement_timer
    global boss_defeated
    global boss_active
    global boss

    world_time += dt * 1.4

    if world_time >= 24 * 60:

        world_time -= 24 * 60
        day += 1


    if announcement_timer > 0:
        announcement_timer -= dt


    keys = pygame.key.get_pressed()


    if player.invuln > 0:
        player.invuln -= dt

    if player.attack_cd > 0:
        player.attack_cd -= dt

    if player.dodge > 0:

        player.dodge -= dt
        player.invuln = max(
            player.invuln,
            0.1
        )


    player.stamina = min(
        player.max_stamina,
        player.stamina + dt * 18
    )

    player.mana = min(
        player.max_mana,
        player.mana + dt * 2
    )


    speed = 4.0


    if player.dodge > 0:

        player.vx = player.facing * 9

    else:

        if keys[pygame.K_a]:

            player.vx -= 0.55
            player.facing = -1

        if keys[pygame.K_d]:

            player.vx += 0.55
            player.facing = 1

        if (
            not keys[pygame.K_a]
            and not keys[pygame.K_d]
        ):
            player.vx *= 0.78

        player.vx = clamp(
            player.vx,
            -speed,
            speed
        )


    player.vy += GRAVITY

    move_entity(
        player,
        28,
        52
    )


    if player.y > WORLD_H * TILE:

        player.x = spawn_x * TILE
        player.y = (spawn_ground - 3) * TILE
        player.hp = player.max_hp / 2


    is_night = (
        world_time >= 19 * 60
        or world_time < 5 * 60
    )

    spawn_timer -= dt

    if (
        is_night
        and not boss_active
        and spawn_timer <= 0
        and len(enemies) < 12
    ):

        spawn_enemy()

        spawn_timer = random.uniform(
            1.2,
            3.0
        )


    # ENEMIES
    for e in enemies[:]:

        e.cooldown -= dt
        e.hurt -= dt

        e.vy += GRAVITY

        dx = player.x - e.x

        if abs(dx) < 500:

            e.vx += (
                1 if dx > 0 else -1
            ) * e.speed * 0.07

            e.vx = clamp(
                e.vx,
                -e.speed,
                e.speed
            )

        move_entity(
            e,
            e.w,
            e.h
        )


        if (
            abs(player.x - e.x) < 35
            and abs(player.y - e.y) < 45
            and player.invuln <= 0
        ):

            damage = (
                10
                if e.kind != "wraith"
                else 14
            )

            player.hp -= damage

            player.invuln = 0.65

            burst(
                player.x + 14,
                player.y + 24,
                (220, 80, 70),
                10,
                2
            )

            if player.hp <= 0:

                player.hp = player.max_hp

                player.x = spawn_x * TILE
                player.y = (
                    spawn_ground - 3
                ) * TILE

                say(
                    "You respawned at the campfire.",
                    3
                )


    # PROJECTILES
    for p in projectiles[:]:

        p["x"] += p["vx"]
        p["life"] -= dt

        hit = False


        for e in enemies[:]:

            if (
                abs(
                    p["x"]
                    - (e.x + e.w / 2)
                ) < 18
                and abs(
                    p["y"]
                    - (e.y + e.h / 2)
                ) < 28
            ):

                damage_enemy(
                    e,
                    22,
                    2
                )

                hit = True

                if e.hp <= 0:
                    enemies.remove(e)

                break


        if (
            boss_active
            and boss
            and abs(
                p["x"]
                - (boss["x"] + 45)
            ) < 50
            and abs(
                p["y"]
                - (boss["y"] + 50)
            ) < 60
        ):

            boss["hp"] -= 18
            hit = True


        if (
            hit
            or p["life"] <= 0
        ):

            if hit:

                burst(
                    p["x"],
                    p["y"],
                    (240, 210, 100),
                    5,
                    2
                )

            if p in projectiles:
                projectiles.remove(p)


    # BOSS
    if boss_active and boss:

        b = boss

        b["hurt"] -= dt
        b["cooldown"] -= dt

        b["x"] += clamp(
            (player.x - b["x"]) * 0.008,
            -1.8,
            1.8
        )

        b["y"] += (
            math.sin(
                pygame.time.get_ticks() / 500
            ) * 0.6
        )


        if b["cooldown"] <= 0:

            b["cooldown"] = (
                1.3
                if b["phase"] == 1
                else 0.8
            )

            burst(
                b["x"] + 45,
                b["y"] + 55,
                (160, 80, 210),
                12,
                4
            )

            if (
                abs(player.x - b["x"]) < 250
                and player.invuln <= 0
            ):

                player.hp -= (
                    15
                    if b["phase"] == 1
                    else 22
                )

                player.invuln = 0.5


        if b["hp"] < 1500:
            b["phase"] = 2


        if b["hp"] <= 0:

            boss_defeated = True
            boss_active = False
            boss = None

            say(
                "THE FOREST IS SAVED!",
                6
            )

            burst(
                player.x,
                player.y,
                (255, 220, 80),
                50,
                6
            )


    if (
        world_time >= 24 * 60 - 1
        and not boss_active
        and not boss_defeated
    ):
        summon_boss()


    update_particles(dt)


# ============================================================
# DRAW BACKGROUND
# ============================================================

def sky_color():

    t = (
        world_time
        / (24 * 60)
        * math.tau
    )

    light = (
        math.sin(
            t - math.pi / 2
        ) + 1
    ) / 2

    return (
        int(18 + 92 * light),
        int(25 + 125 * light),
        int(48 + 160 * light)
    )


def draw_background():

    c = sky_color()

    screen.fill(c)

    hour = world_time / 60

    night = (
        hour >= 19
        or hour < 5
    )


    if night:

        sx, sy = 1050, 120

        pygame.draw.circle(
            screen,
            (225, 230, 205),
            (sx, sy),
            34
        )

        pygame.draw.circle(
            screen,
            c,
            (sx + 13, sy - 7),
            31
        )

        random.seed(123)

        for _ in range(35):

            x = random.randint(
                0,
                WIDTH
            )

            y = random.randint(
                20,
                300
            )

            pygame.draw.circle(
                screen,
                (220, 225, 230),
                (x, y),
                1
            )

        random.seed()


    else:

        pygame.draw.circle(
            screen,
            (255, 225, 125),
            (1030, 125),
            42
        )


    pts = [
        (0, HEIGHT)
    ]

    for x in range(
        0,
        WIDTH + 40,
        40
    ):

        y = (
            430
            + math.sin(
                (x + cam_x * 0.12)
                * 0.006
            ) * 55
            + math.sin(x * 0.017) * 25
        )

        pts.append((x, y))

    pts.append(
        (WIDTH, HEIGHT)
    )

    pygame.draw.polygon(
        screen,
        (32, 65, 52),
        pts
    )


# ============================================================
# DRAW WORLD
# ============================================================

def draw_world():

    start_x = max(
        0,
        int(cam_x // TILE) - 2
    )

    end_x = min(
        WORLD_W,
        int(
            (cam_x + WIDTH)
            // TILE
        ) + 3
    )

    start_y = max(
        0,
        int(cam_y // TILE) - 2
    )

    end_y = min(
        WORLD_H,
        int(
            (cam_y + HEIGHT)
            // TILE
        ) + 3
    )


    for y in range(
        start_y,
        end_y
    ):

        for x in range(
            start_x,
            end_x
        ):

            b = world[y][x]

            if not b:
                continue

            sx = x * TILE - cam_x
            sy = y * TILE - cam_y

            col = BLOCKS[b]

            pygame.draw.rect(
                screen,
                col,
                (
                    sx,
                    sy,
                    TILE,
                    TILE
                )
            )


            if b in (
                "dirt",
                "stone"
            ):

                dark = tuple(
                    max(0, c - 20)
                    for c in col
                )

                pygame.draw.rect(
                    screen,
                    dark,
                    (
                        sx,
                        sy,
                        TILE,
                        2
                    )
                )


            if b == "grass":

                pygame.draw.rect(
                    screen,
                    (91, 160, 74),
                    (
                        sx,
                        sy,
                        TILE,
                        5
                    )
                )


# ============================================================
# DRAW PLAYER
# ============================================================

def draw_player():

    x = int(
        player.x - cam_x
    )

    y = int(
        player.y - cam_y
    )


    if (
        player.invuln > 0
        and int(
            player.invuln * 18
        ) % 2 == 0
    ):
        return


    pygame.draw.ellipse(
        screen,
        (10, 15, 15),
        (
            x - 5,
            y + 47,
            38,
            9
        )
    )


    pygame.draw.rect(
        screen,
        (45, 55, 80),
        (
            x + 5,
            y + 35,
            8,
            17
        )
    )

    pygame.draw.rect(
        screen,
        (45, 55, 80),
        (
            x + 17,
            y + 35,
            8,
            17
        )
    )


    pygame.draw.rect(
        screen,
        (48, 105, 122),
        (
            x + 3,
            y + 18,
            24,
            22
        ),
        border_radius=5
    )


    pygame.draw.rect(
        screen,
        (75, 150, 160),
        (
            x + 6,
            y + 20,
            18,
            5
        )
    )


    pygame.draw.circle(
        screen,
        (205, 157, 118),
        (
            x + 15,
            y + 10
        ),
        10
    )


    pygame.draw.arc(
        screen,
        (45, 30, 25),
        (
            x + 5,
            y,
            20,
            18
        ),
        math.pi,
        math.tau,
        5
    )


    pygame.draw.circle(
        screen,
        (20, 20, 20),
        (
            x + 15
            + player.facing * 5,
            y + 9
        ),
        2
    )


    ax = (
        x + 25
        if player.facing > 0
        else x - 2
    )


    pygame.draw.line(
        screen,
        (205, 157, 118),
        (
            x + 15,
            y + 24
        ),
        (
            ax,
            y + 27
        ),
        5
    )


    if selected == 6:

        pygame.draw.line(
            screen,
            (225, 230, 235),
            (
                ax,
                y + 27
            ),
            (
                ax
                + player.facing * 24,
                y + 12
            ),
            5
        )


        pygame.draw.line(
            screen,
            (120, 80, 45),
            (
                ax,
                y + 27
            ),
            (
                ax
                + player.facing * 8,
                y + 24
            ),
            5
        )


# ============================================================
# DRAW ENEMY
# ============================================================

def draw_enemy(e):

    x = int(e.x - cam_x)
    y = int(e.y - cam_y)


    if e.kind == "slime":

        pygame.draw.ellipse(
            screen,
            (70, 180, 90),
            (
                x,
                y,
                e.w,
                e.h
            )
        )

        pygame.draw.circle(
            screen,
            (20, 40, 25),
            (
                x + 7,
                y + 8
            ),
            2
        )

        pygame.draw.circle(
            screen,
            (20, 40, 25),
            (
                x + 17,
                y + 8
            ),
            2
        )


    elif e.kind == "zombie":

        pygame.draw.rect(
            screen,
            (67, 104, 71),
            (
                x + 2,
                y + 12,
                e.w - 4,
                e.h - 12
            ),
            border_radius=5
        )

        pygame.draw.rect(
            screen,
            (130, 92, 66),
            (
                x + 3,
                y,
                e.w - 6,
                20
            ),
            border_radius=4
        )

        pygame.draw.circle(
            screen,
            (220, 70, 60),
            (
                x + 8,
                y + 8
            ),
            3
        )

        pygame.draw.circle(
            screen,
            (220, 70, 60),
            (
                x + 18,
                y + 8
            ),
            3
        )


    else:

        pygame.draw.ellipse(
            screen,
            (105, 70, 150),
            (
                x,
                y,
                e.w,
                e.h
            )
        )

        pygame.draw.circle(
            screen,
            (235, 220, 250),
            (
                x + 8,
                y + 12
            ),
            4
        )

        pygame.draw.circle(
            screen,
            (235, 220, 250),
            (
                x + 20,
                y + 12
            ),
            4
        )


    if e.hp < e.max_hp:

        pygame.draw.rect(
            screen,
            (25, 25, 25),
            (
                x,
                y - 8,
                e.w,
                4
            )
        )

        pygame.draw.rect(
            screen,
            (200, 70, 70),
            (
                x,
                y - 8,
                e.w * max(
                    0,
                    e.hp / e.max_hp
                ),
                4
            )
        )


# ============================================================
# DRAW BOSS
# ============================================================

def draw_boss():

    if not boss_active or not boss:
        return

    b = boss

    x = int(
        b["x"] - cam_x
    )

    y = int(
        b["y"] - cam_y
    )

    pulse = int(
        5 * math.sin(
            pygame.time.get_ticks()
            / 150
        )
    )


    pygame.draw.circle(
        screen,
        (90, 45, 130),
        (
            x + 45,
            y + 52
        ),
        62 + pulse,
        2
    )


    pygame.draw.circle(
        screen,
        (50, 90, 55),
        (
            x + 45,
            y + 52
        ),
        52
    )


    pygame.draw.circle(
        screen,
        (150, 105, 60),
        (
            x + 45,
            y + 42
        ),
        34
    )


    pygame.draw.circle(
        screen,
        (20, 20, 20),
        (
            x + 34,
            y + 38
        ),
        7
    )

    pygame.draw.circle(
        screen,
        (20, 20, 20),
        (
            x + 56,
            y + 38
        ),
        7
    )


    pygame.draw.circle(
        screen,
        (240, 70, 70),
        (
            x + 34,
            y + 38
        ),
        3
    )

    pygame.draw.circle(
        screen,
        (240, 70, 70),
        (
            x + 56,
            y + 38
        ),
        3
    )


    pygame.draw.polygon(
        screen,
        (80, 55, 35),
        [
            (x + 10, y + 28),
            (x - 12, y + 4),
            (x + 8, y + 40)
        ]
    )

    pygame.draw.polygon(
        screen,
        (80, 55, 35),
        [
            (x + 80, y + 28),
            (x + 102, y + 4),
            (x + 82, y + 40)
        ]
    )


    text(
        "ANCIENT FOREST GUARDIAN",
        WIDTH // 2,
        24,
        SMALL,
        (255, 225, 180),
        "midtop"
    )


    bw = 620

    pygame.draw.rect(
        screen,
        (25, 20, 25),
        (
            WIDTH // 2 - bw // 2,
            48,
            bw,
            22
        ),
        border_radius=5
    )


    hp_ratio = max(
        0,
        b["hp"] / b["max_hp"]
    )


    pygame.draw.rect(
        screen,
        (190, 55, 75),
        (
            WIDTH // 2 - bw // 2 + 3,
            51,
            (bw - 6) * hp_ratio,
            16
        ),
        border_radius=4
    )


    text(
        f'{int(b["hp"])} / {b["max_hp"]}   PHASE {b["phase"]}',
        WIDTH // 2,
        59,
        SMALL,
        (255, 245, 245),
        "center"
    )


# ============================================================
# PROJECTILES
# ============================================================

def draw_projectiles():

    for p in projectiles:

        x = int(
            p["x"] - cam_x
        )

        y = int(
            p["y"] - cam_y
        )

        pygame.draw.line(
            screen,
            (245, 220, 130),
            (
                x,
                y
            ),
            (
                x - p["vx"] * 1.5,
                y
            ),
            3
        )

        pygame.draw.circle(
            screen,
            (255, 240, 160),
            (
                x,
                y
            ),
            3
        )


# ============================================================
# PARTICLES
# ============================================================

def draw_particles():

    for p in particles:

        pygame.draw.circle(
            screen,
            p.color,
            (
                int(p.x - cam_x),
                int(p.y - cam_y)
            ),
            p.size
        )


# ============================================================
# UI
# ============================================================

def draw_ui():

    # TOP LEFT
    rect_alpha(
        screen,
        (8, 12, 18, 210),
        (16, 16, 300, 156),
        12
    )


    text(
        f"DAY {day}  •  {time_string()}",
        30,
        29,
        FONT,
        (235, 240, 230)
    )


    night = (
        world_time >= 19 * 60
        or world_time < 5 * 60
    )


    text(
        "NIGHT" if night else "DAYLIGHT",
        30,
        54,
        SMALL,
        (200, 210, 220)
    )


    bars = [
        (
            "LIFE",
            player.hp,
            player.max_hp,
            (205, 65, 70)
        ),
        (
            "MANA",
            player.mana,
            player.max_mana,
            (80, 120, 225)
        ),
        (
            "STAMINA",
            player.stamina,
            player.max_stamina,
            (215, 175, 65)
        )
    ]


    for i, (
        name,
        val,
        mx,
        col
    ) in enumerate(bars):

        y = 82 + i * 27

        text(
            name,
            30,
            y,
            SMALL,
            (210, 215, 220)
        )


        pygame.draw.rect(
            screen,
            (30, 35, 42),
            (
                92,
                y + 2,
                190,
                15
            ),
            border_radius=5
        )


        pygame.draw.rect(
            screen,
            col,
            (
                94,
                y + 4,
                186 * clamp(
                    val / mx,
                    0,
                    1
                ),
                11
            ),
            border_radius=4
        )


        text(
            f"{int(val)}/{int(mx)}",
            290,
            y,
            SMALL,
            (220, 225, 230),
            "topright"
        )


    # OBJECTIVE
    rect_alpha(
        screen,
        (8, 12, 18, 180),
        (
            WIDTH - 315,
            16,
            299,
            88
        ),
        12
    )


    text(
        "OBJECTIVE",
        WIDTH - 295,
        29,
        SMALL,
        (250, 210, 120)
    )


    if boss_defeated:

        text(
            "Forest Guardian defeated!",
            WIDTH - 295,
            52,
            SMALL
        )

    elif boss_active:

        text(
            "Defeat the Guardian!",
            WIDTH - 295,
            52,
            SMALL
        )

    else:

        text(
            "Explore • Mine • Survive",
            WIDTH - 295,
            52,
            SMALL
        )


    text(
        "E: Inventory   ESC: Pause",
        WIDTH - 295,
        75,
        SMALL,
        (170, 180, 190)
    )


    # HOTBAR
    sw = 72
    total = 9 * sw

    bx = WIDTH // 2 - total // 2
    by = HEIGHT - 92


    for i, item in enumerate(items):

        r = pygame.Rect(
            bx + i * sw,
            by,
            64,
            64
        )


        pygame.draw.rect(
            screen,
            (18, 22, 28),
            r,
            border_radius=7
        )


        pygame.draw.rect(
            screen,
            (
                (230, 190, 80)
                if i == selected
                else (85, 95, 105)
            ),
            r,
            2,
            border_radius=7
        )


        text(
            i + 1,
            r.x + 7,
            r.y + 6,
            SMALL,
            (210, 215, 220)
        )


        cx, cy = r.center


        if item == "Sword":

            pygame.draw.line(
                screen,
                (225, 230, 235),
                (
                    cx - 12,
                    cy + 12
                ),
                (
                    cx + 12,
                    cy - 12
                ),
                6
            )


        elif item == "Bow":

            pygame.draw.arc(
                screen,
                (170, 110, 55),
                (
                    cx - 12,
                    cy - 17,
                    cx + 16,
                    cy + 34
                ),
                -1.2,
                1.2,
                4
            )


        elif item == "Potion":

            pygame.draw.rect(
                screen,
                (170, 65, 150),
                (
                    cx - 8,
                    cy - 5,
                    16,
                    22
                ),
                border_radius=4
            )


        elif item == "Torch":

            pygame.draw.circle(
                screen,
                (255, 180, 65),
                (
                    cx,
                    cy - 7
                ),
                9
            )


        else:

            pygame.draw.rect(
                screen,
                BLOCKS.get(
                    item.lower(),
                    (150, 150, 150)
                ),
                (
                    cx - 11,
                    cy - 11,
                    22,
                    22
                ),
                border_radius=3
            )


        if item in counts:

            text(
                counts[item],
                r.right - 5,
                r.bottom - 4,
                SMALL,
                (245, 245, 245),
                "bottomright"
            )


    # ANNOUNCEMENT
    if announcement_timer > 0:

        w = 700

        rect_alpha(
            screen,
            (10, 10, 15, 215),
            (
                WIDTH // 2 - w // 2,
                112,
                w,
                58
            ),
            10
        )


        text(
            announcement,
            WIDTH // 2,
            141,
            FONT,
            (255, 225, 145),
            "center"
        )


    # CROSSHAIR
    mx, my = pygame.mouse.get_pos()

    pygame.draw.line(
        screen,
        (235, 240, 240),
        (
            mx - 7,
            my
        ),
        (
            mx + 7,
            my
        ),
        1
    )

    pygame.draw.line(
        screen,
        (235, 240, 240),
        (
            mx,
            my - 7
        ),
        (
            mx,
            my + 7
        ),
        1
    )


# ============================================================
# INVENTORY
# ============================================================

def draw_inventory():

    if not inventory_open:
        return


    overlay = pygame.Surface(
        (WIDTH, HEIGHT),
        pygame.SRCALPHA
    )

    overlay.fill(
        (0, 0, 0, 155)
    )

    screen.blit(
        overlay,
        (0, 0)
    )


    panel = pygame.Rect(
        WIDTH // 2 - 380,
        HEIGHT // 2 - 250,
        760,
        500
    )


    pygame.draw.rect(
        screen,
        (25, 30, 38),
        panel,
        border_radius=15
    )


    pygame.draw.rect(
        screen,
        (120, 130, 145),
        panel,
        2,
        border_radius=15
    )


    text(
        "INVENTORY & FORGE",
        panel.centerx,
        panel.y + 28,
        BIG,
        (240, 225, 180),
        "center"
    )


    for i, item in enumerate(items):

        x = (
            panel.x
            + 35
            + (i % 3) * 235
        )

        y = (
            panel.y
            + 85
            + (i // 3) * 75
        )


        pygame.draw.rect(
            screen,
            (38, 45, 54),
            (
                x,
                y,
                210,
                58
            ),
            border_radius=8
        )


        text(
            item,
            x + 14,
            y + 12,
            FONT
        )


        text(
            f"x {counts.get(item, 0)}",
            x + 190,
            y + 12,
            FONT,
            (230, 200, 110),
            "topright"
        )


    text(
        "E to close",
        panel.centerx,
        panel.bottom - 25,
        SMALL,
        (170, 180, 190),
        "midbottom"
    )


# ============================================================
# PAUSE
# ============================================================

def draw_pause():

    if not paused:
        return


    rect_alpha(
        screen,
        (5, 8, 12, 180),
        (0, 0, WIDTH, HEIGHT)
    )


    text(
        "PAUSED",
        WIDTH // 2,
        HEIGHT // 2 - 30,
        TITLE,
        (245, 225, 170),
        "center"
    )


    text(
        "Press ESC to continue",
        WIDTH // 2,
        HEIGHT // 2 + 35,
        FONT,
        (215, 220, 225),
        "center"
    )


# ============================================================
# MAIN LOOP
# ============================================================

running = True


while running:

    dt = clock.tick(FPS) / 1000.0


    for event in pygame.event.get():

        if event.type == pygame.QUIT:
            running = False


        if event.type == pygame.KEYDOWN:

            if event.key == pygame.K_ESCAPE:
                paused = not paused


            if (
                event.key == pygame.K_e
                and not paused
            ):
                inventory_open = not inventory_open


            if (
                event.key == pygame.K_SPACE
                and not paused
                and player.grounded
            ):

                player.vy = -10.5
                player.grounded = False


            if (
                event.key == pygame.K_LSHIFT
                and not paused
                and player.stamina >= 25
                and player.dodge <= 0
            ):

                player.stamina -= 25
                player.dodge = 0.32


            if (
                pygame.K_1
                <= event.key
                <= pygame.K_9
            ):

                selected = (
                    event.key
                    - pygame.K_1
                )


            if (
                event.key == pygame.K_b
                and not boss_active
            ):

                summon_boss()


        if (
            event.type
            == pygame.MOUSEBUTTONDOWN
            and not paused
            and not inventory_open
        ):

            if event.button == 1:

                if selected == 7:
                    shoot()
                else:
                    attack()


            elif event.button == 3:

                mx, my = pygame.mouse.get_pos()

                tx = int(
                    (mx + cam_x)
                    // TILE
                )

                ty = int(
                    (my + cam_y)
                    // TILE
                )


                if (
                    0 <= tx < WORLD_W
                    and 0 <= ty < WORLD_H
                    and world[ty][tx] is None
                ):

                    item = items[selected].lower()


                    if (
                        item in (
                            "wood",
                            "stone"
                        )
                        and counts.get(
                            items[selected],
                            0
                        ) > 0
                    ):

                        world[ty][tx] = item

                        counts[
                            items[selected]
                        ] -= 1


    if (
        not paused
        and not inventory_open
    ):

        update_game(dt)


    # CAMERA
    target_x = (
        player.x
        - WIDTH / 2
    )

    target_y = (
        player.y
        - HEIGHT / 2
    )


    cam_x += (
        target_x - cam_x
    ) * 0.12

    cam_y += (
        target_y - cam_y
    ) * 0.12


    cam_x = clamp(
        cam_x,
        0,
        WORLD_W * TILE - WIDTH
    )

    cam_y = clamp(
        cam_y,
        0,
        WORLD_H * TILE - HEIGHT
    )


    # DRAW
    draw_background()
    draw_world()


    for e in enemies:
        draw_enemy(e)


    draw_projectiles()
    draw_boss()
    draw_player()
    draw_particles()
    draw_ui()
    draw_inventory()
    draw_pause()


    pygame.display.flip()


pygame.quit()
sys.exit()