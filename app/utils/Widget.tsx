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
      }}>
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
                    clickActionData={{ uri: `sportappdev://meal-details/${meal.id}` }}
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
                    clickActionData={{ uri: `sportappdev://meal-details/${meal.id}` }}
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
