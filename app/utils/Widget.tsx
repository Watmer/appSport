import React from "react";
import { FlexWidget, IconWidget, ListWidget, OverlapWidget, TextWidget } from "react-native-android-widget";

export function TodayMealsWidget({ widgetInfo }: any) {
  const meals = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"];

  const mealsInfo = widgetInfo?.meals || [];

  const sortedMeals = mealsInfo?.slice().sort((a: any, b: any) => meals.indexOf(a.meal) - meals.indexOf(b.meal));

  const uncompletedMeals = sortedMeals?.filter((meal: any) => !meal.completed);
  const completedMeals = sortedMeals?.filter((meal: any) => meal.completed);

  return (
    <OverlapWidget
      style={{
        height: "match_parent",
        width: "match_parent",
      }}
    >
      <FlexWidget
        style={{
          width: "match_parent",
          height: "match_parent",
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          borderRadius: 15,
          backgroundColor: "#1e1e1e",
          borderColor: "#2e2e2e",
          borderWidth: 1,
        }}
      >
        {uncompletedMeals?.length > 0 ||
          completedMeals?.length > 0 ? (
          <ListWidget
            style={{
              height: "match_parent",
              width: "match_parent",
              margin: 10,
            }}
          >
            {uncompletedMeals?.length > 0 && (
              uncompletedMeals?.map((meal: any, i: number) => (
                <FlexWidget
                  key={i}
                  style={{
                    width: "match_parent",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 5,
                  }}
                >
                  <FlexWidget
                    style={{
                      width: "match_parent",
                      alignItems: "center",
                      flexDirection: 'row',
                      justifyContent: "flex-start",
                      borderRadius: 15,
                      backgroundColor: "#003C5A",
                      padding: 10,
                    }}
                    clickAction="OPEN_URI"
                    clickActionData={{ uri: `sportapp://meal-details/${meal.id}` }}
                  >
                    <IconWidget
                      font="MaterialIcons-Regular"
                      icon="check_box_outline_blank"
                      size={30}
                      style={{ color: "#ffaa00", marginRight: 6 }}
                      clickAction="MARK_COMPLETED"
                      clickActionData={{ mealId: meal.id }}
                    />
                    <FlexWidget
                      style={{
                        justifyContent: "flex-start",
                        borderRadius: 15,
                        backgroundColor: "#003C5A",
                        padding: 10,
                      }}
                    >
                      <TextWidget
                        text={meal.meal}
                        style={{ color: '#cfcfcfff' }}
                      />
                      <TextWidget
                        text={meal.foodName}
                        style={{ color: '#ffffffff' }}
                      />
                    </FlexWidget>
                  </FlexWidget>
                </FlexWidget>
              ))
            )}
            {completedMeals?.length > 0 && (
              completedMeals?.map((meal: any, i: number) => (
                <FlexWidget
                  key={i}
                  style={{
                    width: "match_parent",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 5,
                  }}
                >
                  <FlexWidget
                    style={{
                      width: "match_parent",
                      alignItems: "center",
                      flexDirection: 'row',
                      justifyContent: "flex-start",
                      borderRadius: 15,
                      backgroundColor: "#003C5A",
                      padding: 10,
                    }}
                    clickAction="OPEN_URI"
                    clickActionData={{ uri: `sportapp://meal-details/${meal.id}` }}
                  >
                    <IconWidget
                      font="MaterialIcons-Regular"
                      icon="check_box"
                      size={30}
                      style={{ color: "#ffaa00", marginRight: 6 }}
                      clickAction="MARK_UNCOMPLETED"
                      clickActionData={{ mealId: meal.id }}
                    />
                    <FlexWidget
                      style={{
                        justifyContent: "flex-start",
                        borderRadius: 15,
                        backgroundColor: "#003C5A",
                        padding: 10,
                      }}

                    >
                      <TextWidget
                        text={meal.meal}
                        style={{ color: '#cfcfcfff' }}
                      />
                      <TextWidget
                        text={meal.foodName}
                        style={{ color: '#ffffffff' }}
                      />
                    </FlexWidget>
                  </FlexWidget>
                </FlexWidget>
              ))
            )}
          </ListWidget>
        ) : (
          <FlexWidget
            clickAction="OPEN_APP"
            style={{
              padding: 15,
            }}
          >
            <TextWidget
              text="No hay comidas registradas."
              style={{
                color: '#ffffffff',
                fontWeight: "bold",
                fontSize: 30
              }}
            />
          </FlexWidget>
        )}
      </FlexWidget>
    </OverlapWidget>
  );
}

function addDays(date: Date, offset: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + offset);
  return copy;
}

export function StreakDaysWidget({ widgetInfo }: { widgetInfo?: any }) {
  const today = new Date();
  const w = widgetInfo?.width ?? 400;
  const h = widgetInfo?.height ?? 400;

  const { col, row } = getWidgetGrid(w, h);
  const { offsetArray, titleSize, fontSize, padding } = getLayoutConfig(col, row);

  const streakDays = widgetInfo?.streakInfo?.streakDays ?? [];
  const frozenDays = widgetInfo?.streakInfo?.frozenDays ?? [];
  const failedDays = widgetInfo?.streakInfo?.failedDays ?? [];
  const streak = widgetInfo?.streakInfo?.streak ?? 0;

  console.log("b", widgetInfo);

  return (
    <OverlapWidget
      style={{ width: "match_parent", height: "match_parent" }}
    >
      <FlexWidget
        style={{
          width: "match_parent",
          height: "match_parent",
          borderRadius: 10,
          backgroundColor: "#1e1e1e",
          borderColor: "#2e2e2e",
          borderWidth: 1,
          padding,
          alignItems: "center",
        }}
      >
        <FlexWidget
          style={{
            alignItems: "center",
            justifyContent: "center",
            marginBottom: padding + 10,
          }}
        >
          <TextWidget
            text={`Días de racha ${streak}`}
            style={{
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: titleSize,
            }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {offsetArray.map((offset, index, array) => {
            const day = addDays(today, offset);
            const key = `dayInfo:${day.getDate()}-${day.getMonth() + 1}-${day.getFullYear()}`;
            let color = "#3C3C3C";

            if (offset === 0) color = "#ffaa00";
            else if (streakDays.includes(key)) color = "#4673c8";
            else if (frozenDays.includes(key)) color = "#50E1FF";
            else if (failedDays.includes(key)) color = "#FF3232";

            return (
              <FlexWidget key={offset}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                <FlexWidget
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    padding,
                    borderRadius: 10,
                    backgroundColor: color as any,
                  }}
                >
                  <TextWidget
                    text={day.getDate().toString()}
                    style={{
                      color: "#ffffff",
                      fontWeight: "bold",
                      fontSize,
                    }}
                  />
                </FlexWidget>

                {index < array.length - 1 && (
                  <FlexWidget
                    style={{
                      padding: padding + 2,
                      backgroundGradient: {
                        from: color as any,
                        to: "#1e1e1e" as any,
                        orientation: "LEFT_RIGHT",
                      },
                    }}
                  />
                )}
              </FlexWidget>
            );
          })}
        </FlexWidget>
      </FlexWidget>
    </OverlapWidget>
  );
}

function getLayoutConfig(col: number, row: number) {
  console.log(col, row);

  if (col >= 4 && row >= 2) {
    return { offsetArray: [-3, -2, -1, 0, 1], fontSize: 18, titleSize: 28, padding: 10 };
  }
  if (col === 3 && row >= 2) {
    return { offsetArray: [-2, -1, 0, 1], fontSize: 17, titleSize: 27, padding: 9 };
  }
  if (col === 2 && row >= 2) {
    return { offsetArray: [-2, -1, 0], fontSize: 16, titleSize: 25, padding: 7 };
  }
  return { offsetArray: [0], fontSize: 14, titleSize: 14, padding: 8 };
}

function getWidgetGrid(width: number, height: number) {
  console.log(width, height);
  const col = Math.round(width / 92);
  const row = Math.round(height / 92);
  console.log(col, row);

  return { col, row };
}


