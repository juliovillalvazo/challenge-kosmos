import React, { useRef, useState, useEffect, useCallback } from 'react';
import Moveable from 'react-moveable';

const App = () => {
    const [moveableComponents, setMoveableComponents] = useState([]);
    const [selected, setSelected] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [showDelete, setShowDelete] = useState(false);

    const getPhotos = useCallback(async () => {
        const response = await fetch(
            'https://jsonplaceholder.typicode.com/photos'
        );
        const data = await response.json();

        setPhotos(data);
    }, []);

    useEffect(() => {
        getPhotos();
    }, [getPhotos]);

    const addMoveable = () => {
        // Create a new moveable component and add it to the array

        setMoveableComponents([
            ...moveableComponents,
            {
                id: Math.floor(Math.random() * Date.now()),
                top: 0,
                left: 0,
                width: 100,
                height: 100,
                imgUrl: photos[Math.floor(Math.random() * photos.length)]?.url,
                updateEnd: true,
            },
        ]);
    };

    const updateMoveable = (id, newComponent, updateEnd = false) => {
        const updatedMoveables = moveableComponents.map((moveable, i) => {
            if (moveable.id === id) {
                return { id, ...newComponent, updateEnd };
            }
            return moveable;
        });
        setMoveableComponents(updatedMoveables);
    };

    const deleteMoveable = () => {
        const updatedMoveables = moveableComponents.filter(
            (moveable) => moveable.id !== selected
        );
        setMoveableComponents(updatedMoveables);
        setShowDelete(false);
    };

    const handleShowDelete = () => {
        setShowDelete(true);
    };

    // const handleResizeStart = (e, setInitialLeft, setInitialWidth) => {
    //     console.log('e', e.direction);
    //     // Check if the resize is coming from the left handle
    //     const [handlePosX, handlePosY] = e.direction;
    //     // 0 => center
    //     // -1 => top or left
    //     // 1 => bottom or right

    //     // -1, -1
    //     // -1, 0
    //     // -1, 1
    //     if (handlePosX === -1) {
    //         console.log('width', moveableComponents, e);
    //         // Save the initial left and width values of the moveable component
    //         const initialLeft = e.left;
    //         const initialWidth = e.width;

    //         setInitialLeft(initialLeft);
    //         setInitialWidth(initialWidth);

    //         // Set up the onResize event handler to update the left value based on the change in width
    //     }
    // };

    return (
        <main style={{ height: '100vh', width: '100vw' }}>
            <button onClick={addMoveable}>Add Moveable</button>
            {showDelete && (
                <button onClick={deleteMoveable}>Delete Moveable</button>
            )}
            <div
                id='parent'
                style={{
                    position: 'relative',
                    background: 'black',
                    height: '80vh',
                    width: '80vw',
                }}
            >
                {moveableComponents.map((item, index) => (
                    <Component
                        {...item}
                        key={index}
                        updateMoveable={updateMoveable}
                        setSelected={setSelected}
                        isSelected={selected === item.id}
                        onShowDelete={handleShowDelete}
                    />
                ))}
            </div>
        </main>
    );
};

export default App;

const Component = ({
    updateMoveable,
    top,
    left,
    width,
    height,
    index,
    imgUrl,
    id,
    setSelected,
    isSelected = false,
    updateEnd,
    onShowDelete,
}) => {
    const ref = useRef();

    const [nodoReferencia, setNodoReferencia] = useState({
        top,
        left,
        width,
        height,
        index,
        imgUrl,
        id,
    });

    let parent = document.getElementById('parent');
    let parentBounds = parent?.getBoundingClientRect();

    const onResize = async (e) => {
        // ACTUALIZAR ALTO Y ANCHO
        let newWidth = e.width;
        let newHeight = e.height;

        const [handlePosX, _handlePosY] = e.direction;
        let leftClick = false;

        if (handlePosX === -1) {
            // Save the initial left and width values of the moveable component
            leftClick = true;
            // Set up the onResize event handler to update the left value based on the change in width
        }

        const positionMaxTop = top + newHeight;
        const positionMaxLeft = left + newWidth;

        if (positionMaxTop > parentBounds?.height)
            newHeight = parentBounds?.height - top;
        if (positionMaxLeft > parentBounds?.width)
            newWidth = parentBounds?.width - left;

        updateMoveable(id, {
            top,
            left: leftClick ? left - (newWidth - width) : left,
            width: newWidth,
            height: newHeight,
            imgUrl,
        });

        // ACTUALIZAR NODO REFERENCIA
        const beforeTranslate = e.drag.beforeTranslate;

        ref.current.style.width = `${e.width}px`;
        ref.current.style.height = `${e.height}px`;

        let translateX = beforeTranslate[0];
        let translateY = beforeTranslate[1];

        ref.current.style.transform = `translate(${translateX}px, ${translateY}px)`;

        console.log(newWidth, height, left, width);

        setNodoReferencia((prevState) => ({
            ...prevState,
            height: newHeight,
            width: newWidth,
            top: top + translateY < 0 ? 0 : top + translateY,
            left: left + translateX < 0 ? 0 : left + translateX,
        }));
    };

    const handleSelection = () => {
        setSelected(id);
        onShowDelete();
    };

    return (
        <>
            <div
                ref={ref}
                className='draggable'
                id={'component-' + id}
                style={{
                    position: 'absolute',
                    top: top,
                    left: left,
                    width: width,
                    height: height,
                    backgroundImage: `url("${imgUrl}")`,
                    backgroundSize: 'cover',
                }}
                onClick={handleSelection}
            />

            <Moveable
                target={isSelected && ref.current}
                resizable
                draggable
                onDrag={(e) => {
                    updateMoveable(id, {
                        top:
                            e.top < 0
                                ? 0
                                : e.top + parentBounds.top + height >
                                  parentBounds.bottom
                                ? parentBounds.bottom -
                                  height -
                                  parentBounds.top
                                : e.top,
                        left:
                            e.left < 0
                                ? 0
                                : e.left >
                                  parentBounds.right - parentBounds.left - width
                                ? parentBounds.right - parentBounds.left - width
                                : e.left,
                        width,
                        height,
                        imgUrl,
                    });
                }}
                onResize={onResize}
                keepRatio={false}
                throttleResize={1}
                renderDirections={['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']}
                edge={true}
                zoom={1}
                origin={false}
                padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
            />
        </>
    );
};
